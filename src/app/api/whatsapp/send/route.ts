import { NextResponse } from "next/server";
import { offlineDB } from "@/lib/dexie";
import { generateUniqueId } from "@/lib/dexie";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { recipientName, recipientPhone, type, referenceId, message, pdfBase64, useWebFallback } = body;

    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const apiVersion = process.env.WHATSAPP_API_VERSION || "v22.0";

    // Clean phone number (remove + and spaces)
    const cleanPhone = recipientPhone.replace(/\D/g, '');

    if (!token || !phoneId) {
      // If no credentials, log and return instruction for frontend to use Web fallback
      if (useWebFallback) {
        const id = generateUniqueId();
        await offlineDB.settings.add({
          id,
          key: "messageLog",
          value: {
            recipientName,
            recipientPhone: cleanPhone,
            type,
            referenceId,
            status: "Sent",
            errorMessage: "Sent via WhatsApp Web (No Cloud API credentials)",
            createdAt: new Date().toISOString()
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as any);
        return NextResponse.json({ ok: true, fallback: true, cleanPhone });
      }

      return NextResponse.json(
        { ok: false, error: "WhatsApp Cloud API credentials not configured." },
        { status: 500 }
      );
    }

    let mediaId = null;

    // If there's a PDF, we need to upload it first
    if (pdfBase64) {
      const buffer = Buffer.from(pdfBase64, "base64");
      const formData = new FormData();
      formData.append("file", new Blob([buffer], { type: "application/pdf" }), "Statement.pdf");
      formData.append("type", "application/pdf");
      formData.append("messaging_product", "whatsapp");

      const uploadRes = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneId}/media`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (uploadData.id) {
        mediaId = uploadData.id;
      } else {
        console.error("WhatsApp Media Upload Error:", uploadData);
      }
    }

    // Send the message
    let payload: any = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanPhone,
    };

    if (body.templateName) {
      // Template sending support
      payload.type = "template";
      payload.template = {
        name: body.templateName,
        language: { code: body.templateLanguage || "en_US" }
      };
      if (body.templateComponents) {
        payload.template.components = body.templateComponents;
      }
    } else if (mediaId) {
      // Send document with caption
      payload.type = "document";
      payload.document = {
        id: mediaId,
        caption: message || "Please find the attached document.",
        filename: `${type}_${recipientName}.pdf`
      };
    } else {
      // Send text only
      payload.type = "text";
      payload.text = {
        preview_url: false,
        body: message,
      };
    }

    const sendRes = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const sendData = await sendRes.json();

    if (sendData.error) {
      const id = generateUniqueId();
      await offlineDB.settings.add({
        id,
        key: "messageLog",
        value: {
          recipientName,
          recipientPhone: cleanPhone,
          type,
          referenceId,
          status: "Failed",
          errorMessage: sendData.error.message,
          createdAt: new Date().toISOString()
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as any);
      return NextResponse.json({ ok: false, error: sendData.error.message }, { status: 400 });
    }

    const id = generateUniqueId();
    await offlineDB.settings.add({
      id,
      key: "messageLog",
      value: {
        recipientName,
        recipientPhone: cleanPhone,
        type,
        referenceId,
        status: "Sent",
        createdAt: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any);

    return NextResponse.json({ ok: true, data: sendData });
  } catch (error: any) {
    console.error("WhatsApp Send Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
