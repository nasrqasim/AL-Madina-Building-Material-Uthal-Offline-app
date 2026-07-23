import { offlineDB } from "@/lib/dexie";
import { generateUniqueId } from "@/lib/dexie";

export async function POST() {
  try {
    console.log("Starting building materials setup using IndexedDB...");
    console.log("Checking offlineDB availability...");
    
    // Test IndexedDB connection
    const testCategories = await offlineDB.categories.toArray();
    const testItems = await offlineDB.items.toArray();
    console.log("Current categories in DB:", testCategories.length);
    console.log("Current items in DB:", testItems.length);

    // Define the complete structure
    const structure = [
      {
        mainCategory: "Cement",
        unit: "Per Bag",
        subCategories: [
          {
            name: "OPC Cement",
            items: [
              "DG Cement OPC",
              "Falcon Cement OPC", 
              "Rock Cement OPC",
              "Lucky Cement OPC"
            ]
          },
          {
            name: "SRC Cement",
            items: [
              "DG Cement SRC"
            ]
          },
          {
            name: "Special Cement",
            items: [
              "Falcon Cement Block",
              "White Cement"
            ]
          }
        ]
      },
      {
        mainCategory: "Bond",
        unit: "Per Bag",
        subCategories: [
          {
            name: "Bond",
            items: [
              "Prechem Bond",
              "DG Bond",
              "Star Bond"
            ]
          }
        ]
      },
      {
        mainCategory: "Scatting",
        unit: "Per Feet",
        subCategories: [
          {
            name: "Scatting",
            items: [
              "Black Scatting",
              "Verona Scatting",
              "Terwala Scatting",
              "Black & Gold Scatting"
            ]
          }
        ]
      },
      {
        mainCategory: "Marble",
        unit: "Per Feet",
        subCategories: [
          {
            name: "Marble",
            items: [
              "Verona Marble",
              "Terwala Marble",
              "Black & Gold Marble",
              "Zairat White Marble"
            ]
          },
          {
            name: "Marble Pati",
            items: [
              "1/2\" Marble Pati",
              "2/3\" Marble Pati",
              "3/4\" Marble Pati"
            ]
          },
          {
            name: "Marble Badar",
            items: [
              "3/4\" Marble Badar"
            ]
          }
        ]
      },
      {
        mainCategory: "Washroom Fittings",
        unit: "Per Piece",
        subCategories: [
          {
            name: "W/C Commode",
            items: [
              "Medium W/C",
              "Large W/C",
              "Extra Large W/C"
            ]
          },
          {
            name: "Commode",
            items: [
              "Normal Commode",
              "Best Commode"
            ]
          },
          {
            name: "Wash Basin",
            items: [
              "Normal Basin",
              "Large Basin",
              "Best Basin"
            ]
          }
        ]
      },
      {
        mainCategory: "Steel",
        unit: "Per Kg",
        subCategories: [
          {
            name: "Saria Steel",
            items: [
              "A-one Steel 2 Solia",
              "A-one Steel 3 Solia",
              "A-one Steel 4 Solia",
              "A-one Steel 5 Solia",
              "Amsali Steel 2 Solia",
              "Amsali Steel 3 Solia",
              "Amsali Steel 4 Solia",
              "Amsali Steel 5 Solia",
              "Unza Steel 2 Solia",
              "Unza Steel 3 Solia",
              "Unza Steel 4 Solia",
              "Unza Steel 5 Solia",
              "Tox bar Steel 2 Solia",
              "Tox bar Steel 3 Solia",
              "Tox bar Steel 4 Solia",
              "Tox bar Steel 5 Solia",
              "Plan bar Steel 2 Solia"
            ]
          },
          {
            name: "Others",
            items: [
              "Bending Wire"
            ]
          }
        ]
      },
      {
        mainCategory: "T-Iron Chader",
        unit: "Per Feet",
        subCategories: [
          {
            name: "T-Iron",
            items: [
              "T-Iron 425 gram",
              "T-Iron 480 gram",
              "T-Iron 500 gram"
            ]
          },
          {
            name: "Chader",
            items: [
              "Chader 3500 No",
              "Chader 4800 No",
              "Chader 6500 No"
            ]
          }
        ]
      },
      {
        mainCategory: "Chokat Door Frame",
        unit: "Per Piece",
        subCategories: [
          {
            name: "Chokat",
            items: [
              "Chokat 2x6",
              "Chokat 2.5x6",
              "Chokat 3x6",
              "Chokat 2.5x6.5",
              "Chokat 2x6.5",
              "Chokat 3x6.5",
              "Chokat 2x7",
              "Chokat 2.5x7",
              "Chokat 3x7",
              "Chokat 3.5x7"
            ]
          },
          {
            name: "Chokat Double Padam",
            items: [
              "Chokat Double Padam 3x7",
              "Chokat Double Padam 3.5x7"
            ]
          }
        ]
      },
      {
        mainCategory: "Fansi Door",
        unit: "Per Piece",
        subCategories: [
          {
            name: "Door Fansi Paype",
            items: [
              "Door Fansi 2x6",
              "Door Fansi 2.5x6",
              "Door Fansi 3x6",
              "Door Fansi 3.5x7",
              "Door Fansi 4x7",
              "Door Fansi 8x7",
              "Door Fansi 3x7",
              "Door Fansi 6x7",
              "Door Fansi 6x4",
              "Door Fansi 10x8"
            ]
          },
          {
            name: "Door Pati",
            items: [
              "Door Pati 2x6",
              "Door Pati 2.5x6",
              "Door Pati 3x6"
            ]
          },
          {
            name: "Window Fansi Paype",
            items: [
              "Window Fansi 2x2",
              "Window Fansi 3x3",
              "Window Fansi 3x4",
              "Window Fansi 4x4",
              "Window Fansi 2.5x2.5"
            ]
          }
        ]
      },
      {
        mainCategory: "Cement Slab Grader",
        unit: "Per Feet",
        subCategories: [
          {
            name: "Cement Slab",
            items: [
              "Cement Slab 1.5x2",
              "Cement Slab 2x2",
              "Cement Slab 3x1.5",
              "Cement Slab 3.5x1.5",
              "Cement Slab 4x1.5",
              "Cement Slab 3x2",
              "Cement Slab 4x2",
              "Cement Slab 2.5x2",
              "Cement Slab 3.5x2",
              "Cement Slab 5 feet",
              "Cement Slab 6 feet",
              "Cement Slab 7 feet",
              "Cement Slab 8 feet",
              "Cement Slab 9 feet",
              "Cement Slab 10 feet",
              "Cement Slab 11 feet",
              "Cement Slab 12 feet",
              "Cement Slab 13 feet",
              "Cement Slab 14 feet",
              "Cement Slab 15 feet",
              "Cement Slab 16 feet"
            ]
          }
        ]
      }
    ];

    let createdMainCategories = 0;
    let createdSubCategories = 0;
    let createdItems = 0;
    let skippedItems = 0;

    // Get existing categories to avoid duplicates
    const existingCategories = await offlineDB.categories.toArray();
    const existingMainCatNames = new Set(
      existingCategories
        .filter(c => c.type === "main")
        .map(c => c.name.toLowerCase())
    );

    for (const categoryGroup of structure) {
      const mainCatName = categoryGroup.mainCategory;
      
      // Check if main category already exists
      let mainCatId;
      if (existingMainCatNames.has(mainCatName.toLowerCase())) {
        const existingMainCat = existingCategories.find(
          c => c.type === "main" && c.name.toLowerCase() === mainCatName.toLowerCase()
        );
        mainCatId = existingMainCat?._id;
        console.log(`Main category already exists: ${mainCatName}`);
      } else {
        // Create main category
        const mainCatIdGenerated = generateUniqueId();
        const mainCat = {
          id: mainCatIdGenerated,
          _id: mainCatIdGenerated,
          name: mainCatName,
          type: "main" as const,
          unit: categoryGroup.unit,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await offlineDB.categories.add(mainCat);
        mainCatId = mainCatIdGenerated;
        createdMainCategories++;
        console.log(`Created main category: ${mainCatName}`);
      }

      // Process sub-categories
      for (const subCat of categoryGroup.subCategories) {
        const subCatId = generateUniqueId();
        
        // Check if sub-category already exists
        const existingSubCat = existingCategories.find(
          c => c.type === "sub" && 
               c.name.toLowerCase() === subCat.name.toLowerCase() &&
               String(c.parentId) === String(mainCatId)
        );

        let subCatIdToUse;
        if (existingSubCat) {
          subCatIdToUse = existingSubCat._id;
          console.log(`Sub-category already exists: ${subCat.name} under ${mainCatName}`);
        } else {
          const newSubCat = {
            id: subCatId,
            _id: subCatId,
            name: subCat.name,
            type: "sub" as const,
            parentId: mainCatId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await offlineDB.categories.add(newSubCat);
          subCatIdToUse = subCatId;
          createdSubCategories++;
          console.log(`Created sub-category: ${subCat.name} under ${mainCatName}`);
        }

        // Process items
        for (const itemName of subCat.items) {
          // Check if item already exists
          const existingItem = await offlineDB.items
            .where("name")
            .equals(itemName)
            .first();

          if (existingItem) {
            // Update existing item with category
            if (String(existingItem.mainCategoryId) !== String(mainCatId)) {
              await offlineDB.items.update(existingItem.id, {
                mainCategoryId: mainCatId,
                subCategoryId: subCatIdToUse,
                unit: categoryGroup.unit,
                updatedAt: new Date().toISOString()
              });
              console.log(`Updated existing item: ${itemName}`);
              createdItems++;
            } else {
              skippedItems++;
              console.log(`Item already has correct category: ${itemName}`);
            }
          } else {
            // Create new item
            const itemId = generateUniqueId();
            const newItem = {
              id: itemId,
              _id: itemId,
              code: `ITEM-${Date.now().toString().slice(-6)}`,
              name: itemName,
              mainCategoryId: mainCatId,
              subCategoryId: subCatIdToUse,
              unit: categoryGroup.unit,
              purchaseRate: 0,
              wholesaleRate: 0,
              retailRate: 0,
              stockQtyCartons: 0,
              stockQty: 0,
              reorderLevel: 5,
              status: "Active",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            await offlineDB.items.add(newItem);
            createdItems++;
            console.log(`Created new item: ${itemName}`);
          }
        }
      }
    }

    return Response.json({
      ok: true,
      createdMainCategories,
      createdSubCategories,
      createdItems,
      skippedItems,
      message: `Setup complete: ${createdMainCategories} main categories, ${createdSubCategories} sub-categories, ${createdItems} items created/updated, ${skippedItems} items skipped`
    });

  } catch (e) {
    console.error("API Error [building-materials-setup POST]:", e);
    return Response.json({
      ok: false,
      message: (e as Error).message
    }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
