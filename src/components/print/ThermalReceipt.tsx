"use client";
import React from "react";
import Image from "next/image";
import { COMPANY_NAME } from "@/lib/company";

interface ThermalReceiptProps {
  data: any;
  items: any[];
  companyInfo: any;
  config: any;
  dateStr: string;
  timeStr: string;
}

/** Helper to convert any value safely to a number, defaulting to 0 */
function safeNum(val: any): number {
  if (val === undefined || val === null || val === "") return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
}

/** Helper to format currency values safely to 2 decimal places */
function fmtMoney(val: any): string {
  return safeNum(val).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Helper to format quantities cleanly (e.g., 3.5 or 1) */
function fmtQty(val: any): string {
  const num = safeNum(val);
  if (Number.isInteger(num)) return num.toString();
  return parseFloat(num.toFixed(2)).toString();
}

export default function ThermalReceipt({
  data,
  items,
  companyInfo,
  config,
  dateStr,
  timeStr,
}: ThermalReceiptProps) {
  const itemsList = items || [];
  const itemCount = itemsList.length;

  // Compute total quantity dynamically across all items & selling units
  const totalQty = itemsList.reduce((acc, item) => {
    const qty = safeNum(item.quantity || item.qty || item.cartons || item.orderedQty || 1);
    return acc + qty;
  }, 0);

  // Financial calculations with safe fallbacks
  const rawSubtotal = safeNum(data.subtotal || data.subTotal);
  const rawTotal = safeNum(data.total || data.totalAmount || data.amount);
  const grossTotal = rawSubtotal > 0 ? rawSubtotal : rawTotal;

  const discount = safeNum(data.discountAmount || data.discount);
  const netTotal = rawTotal > 0 ? rawTotal : Math.max(0, grossTotal - discount);

  const amountReceived = safeNum(data.amountReceived || data.receivedAmount || (data.paymentMethod === "Cash" ? netTotal : 0));
  const cashBack = Math.max(0, amountReceived - netTotal);

  // Calculate total savings (discount)
  const itemsDiscount = itemsList.reduce((acc: number, item: any) => {
    const qty = safeNum(item.quantity || item.qty || item.cartons || 1);
    const rate = safeNum(item.rate || item.unitPrice || item.price);
    const gross = qty * rate;
    const net = safeNum(item.netAmount || item.total || item.amount);
    return acc + Math.max(0, gross - net);
  }, 0);

  const totalSavings = discount > 0 ? discount : itemsDiscount;

  // Determine main item unit for column header (e.g. Price/Ctn, Price/Pcs, Price/Feet)
  const mainUnit = itemsList.length > 0
    ? (itemsList[0].unit || "Ctn").replace(/^Per\s+/i, "")
    : "Ctn";

  const customerName =
    data.customer && data.customer.trim() && data.customer !== "Search Customer..."
      ? data.customer
      : data.supplier && data.supplier.trim()
      ? data.supplier
      : data.partyName && data.partyName.trim()
      ? data.partyName
      : "Walk-in Customer";

  const phoneNo =
    companyInfo?.phone && companyInfo.phone.trim() !== "-"
      ? companyInfo.phone
      : companyInfo?.mobile || "-";

  const operatorName =
    data.operatorName || data.cashier || data.salesPerson || companyInfo?.userName || "Bilal khan";

  const salesPerson = data.salesPerson || data.salesman || "-";
  const paymentType = data.paymentMethod || data.paymentMode || data.paymentTerms || "Cash";

  return (
    <div
      className="thermal-receipt-container text-black bg-white mx-auto font-sans text-[12px] leading-tight box-border"
      style={{
        width: "80mm",
        maxWidth: "100%",
        color: "#000000",
        backgroundColor: "#ffffff",
        padding: "4mm 3mm",
        fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
      }}
    >
      {/* ─── 1. COMPANY LOGO ─── */}
      {(config?.showLogo !== false || companyInfo?.logo) && (
        <div className="flex justify-center mb-1">
          <img
            src={companyInfo?.logo || "/logo.png"}
            alt="Company Logo"
            className="h-12 w-auto object-contain grayscale"
            onError={(e) => {
              // Hide image if failed to load
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        </div>
      )}

      {/* ─── 2. COMPANY NAME & TEL ─── */}
      <div className="text-center mb-2">
        <h1
          className="font-bold uppercase tracking-tight text-black leading-tight"
          style={{ fontSize: "22px", fontFamily: "Arial, sans-serif" }}
        >
          {companyInfo?.companyName || COMPANY_NAME || "AL HADEED TRADERS"}
        </h1>
        <p className="text-[12px] font-normal text-black mt-0.5">
          Tel: {phoneNo}
        </p>
      </div>

      {/* ─── 3. FULL-WIDTH BLACK TITLE BAR ─── */}
      <div
        className="w-full bg-black text-white text-center py-1 font-bold uppercase tracking-wider text-[13px] my-2"
        style={{ backgroundColor: "#000000", color: "#ffffff" }}
      >
        {data.receiptType || "Sale Receipt"}
      </div>

      {/* ─── 4. CUSTOMER INFORMATION SECTION ─── */}
      <div className="text-[12px] text-black my-2 space-y-1 font-sans">
        {/* Receipt No */}
        <div className="flex items-center">
          <span className="italic font-normal w-24">Receipt No.</span>
          <span className="font-bold text-[13px] text-black">
            {data.invoiceNo || data.receiptNo || data.poNumber || "8210"}
          </span>
        </div>

        {/* Date & Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="italic font-normal w-12">Date</span>
            <span className="font-bold text-black">{dateStr}</span>
          </div>
          <div className="flex items-center">
            <span className="italic font-normal mr-1.5">Time</span>
            <span className="font-bold text-black">{timeStr}</span>
          </div>
        </div>

        {/* Operator Name */}
        <div className="flex items-center">
          <span className="italic font-normal w-24">Operator Name:</span>
          <span className="font-bold text-black">{operatorName}</span>
        </div>

        {/* Sales Person */}
        <div className="flex items-center">
          <span className="italic font-normal w-24">Sales Person</span>
          <span className="font-bold text-black">{salesPerson}</span>
        </div>

        {/* Customer Name */}
        <div className="flex items-center">
          <span className="italic font-normal w-24">Customer Name</span>
          <span className="font-bold text-black uppercase">{customerName}</span>
        </div>

        {/* Payment Type */}
        <div className="flex items-center">
          <span className="italic font-normal w-24">Payment Type</span>
          <span className="font-bold text-black uppercase">{paymentType}</span>
        </div>
      </div>

      {/* ─── 5. PRODUCT TABLE HEADER ─── */}
      <div className="border-t border-b border-black py-1 my-2 text-[12px] font-bold text-black">
        <div className="grid grid-cols-12 items-center">
          <span className="col-span-5 text-left italic font-bold">Description</span>
          <span className="col-span-2 text-right italic font-bold">Qty</span>
          <span className="col-span-2.5 text-right italic font-bold pr-1">Price/{mainUnit}</span>
          <span className="col-span-2.5 text-right italic font-bold">Total</span>
        </div>
      </div>

      {/* ─── 6. DYNAMIC PRODUCT ITEMS ─── */}
      <div className="space-y-2 mb-2 text-[12px] text-black">
        {itemsList.map((item: any, i: number) => {
          const desc = item.description || item.itemName || item.name || "Item";
          const qty = safeNum(item.quantity || item.qty || item.cartons || item.orderedQty || 1);
          const rate = safeNum(item.rate || item.unitPrice || item.price);
          const netAmt = safeNum(item.netAmount || item.total || item.amount || qty * rate);
          const unitLabel = item.unit ? item.unit.replace(/^Per\s+/i, "") : "";

          return (
            <div key={i} className="border-b border-gray-300 pb-1 font-sans">
              {/* Item Description Line */}
              <div className="text-left font-normal text-[12px] text-black leading-snug">
                {desc}
              </div>
              {/* Quantities, Unit Price, and Line Total */}
              <div className="grid grid-cols-12 text-[12px] text-black mt-0.5 items-center">
                <span className="col-span-5"></span>
                <span className="col-span-2 text-right font-bold">
                  {fmtQty(qty)} {unitLabel ? <span className="text-[10px] font-normal">{unitLabel}</span> : null}
                </span>
                <span className="col-span-2.5 text-right font-bold pr-1">
                  {rate > 0 ? Math.round(rate) : "-"}
                </span>
                <span className="col-span-2.5 text-right font-bold">
                  {Math.round(netAmt)}
                </span>
              </div>
            </div>
          );
        })}

        {itemsList.length === 0 && (
          <div className="text-center py-2 text-black font-normal italic">
            No items found
          </div>
        )}
      </div>

      {/* ─── 7. ITEM & QTY SUMMARY BAR ─── */}
      <div className="border-t border-b border-black py-1 my-2 text-[12px] font-bold text-black flex justify-between">
        <span>
          Item(s) <span className="font-bold ml-1">{itemCount}</span>
        </span>
        <span>
          Total Qty <span className="font-bold ml-1">{fmtQty(totalQty)}</span>
        </span>
      </div>

      {/* ─── 8. TOTALS SECTION ─── */}
      <div className="space-y-1 text-[12px] text-black my-2">
        {/* Gross Total */}
        <div className="flex justify-between items-center">
          <span className="font-bold text-black">Gross Total</span>
          <span className="font-bold text-black">{fmtMoney(grossTotal)}</span>
        </div>

        {/* Discount */}
        <div className="flex justify-between items-center">
          <span className="font-bold text-black">Discount</span>
          <span className="font-bold text-black">{fmtMoney(discount)}</span>
        </div>

        {/* Net Total PKR - LARGEST AND BOLDEST TEXT */}
        <div className="flex justify-between items-center py-1 border-t border-b border-black my-1">
          <span
            className="font-black uppercase tracking-tight text-black"
            style={{ fontSize: "16px", fontWeight: "900" }}
          >
            Net Total PKR
          </span>
          <span
            className="font-black text-black"
            style={{ fontSize: "18px", fontWeight: "900" }}
          >
            {fmtMoney(netTotal)}
          </span>
        </div>

        {/* Amount Received */}
        <div className="flex justify-between items-center pt-0.5">
          <span className="font-bold text-black">Amount Received</span>
          <span className="font-bold text-black">{fmtMoney(amountReceived)}</span>
        </div>

        {/* Cash Back PKR */}
        <div className="flex justify-between items-center">
          <span className="font-bold text-black">Cash Back PKR</span>
          <span className="font-bold text-black">{fmtMoney(cashBack)}</span>
        </div>
      </div>

      {/* ─── 9. VISIT NOTE & SAVINGS ─── */}
      <div className="text-center font-bold my-3 text-[12px] text-black">
        <div>*Thanks For Your Visit*</div>
        {totalSavings > 0 && (
          <div className="mt-0.5 font-bold text-[12px]">
            You Saved Rs. {Math.round(totalSavings)}
          </div>
        )}
      </div>

      {/* ─── 10. VERY BOTTOM SOFTWARE FOOTER ─── */}
      <div className="border-t border-black pt-1.5 mt-2 text-center">
        <p
          className="font-bold text-black text-center"
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "13px",
            fontWeight: "bold",
          }}
        >
          Software By: Roonjha Developers - 03152914836
        </p>
      </div>
    </div>
  );
}

