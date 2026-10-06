import { MongoClient } from "mongodb";

const uri = "mongodb+srv://rsinghranjeet74282:Ranjeet123@cluster0.ibrwq.mongodb.net/invoiceDB";

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("invoiceDB");
  const coll = db.collection("invoices");

  // Find all documents with non-empty quotationNo
  const docs = await coll
    .find({
      "details.quotationNo": { $type: "string", $ne: "" },
    })
    .project({
      _id: 1,
      "details.invoiceNo": 1,
      "details.quotationNo": 1,
      createdAt: 1,
      "details.invoiceTitle": 1,
    })
    .sort({ "details.quotationNo": 1 })
    .toArray();

  console.log("=== ALL DOCUMENTS WITH QUOTATIONNO ===");
  console.log("Total:", docs.length);
  docs.forEach((d) => console.log(JSON.stringify(d)));

  // Group by quotationNo to find duplicates
  const groups = {};
  for (const d of docs) {
    const q = d.details?.quotationNo || "(empty)";
    if (!groups[q]) groups[q] = [];
    groups[q].push(d);
  }

  console.log("\n=== GROUPS ===");
  let foundDuplicates = false;
  for (const [q, items] of Object.entries(groups)) {
    if (items.length > 1) {
      foundDuplicates = true;
      console.log("\n*** DUPLICATE FOUND for quotationNo:", q, "***");
      items.forEach((item) => console.log(JSON.stringify(item)));
    } else {
      console.log("SINGLE:", q, "->", items[0]._id, items[0].details?.invoiceNo);
    }
  }

  if (!foundDuplicates) {
    console.log("\n*** NO DUPLICATE DOCUMENTS FOUND IN DATABASE ***");
    console.log("All quotationNo values are unique across documents.");
  }

  // Also check for any documents where invoiceNo is non-empty AND quotationNo is non-empty
  const bothNonEmpty = await coll
    .find({
      "details.invoiceNo": { $type: "string", $ne: "" },
      "details.quotationNo": { $type: "string", $ne: "" },
    })
    .project({
      _id: 1,
      "details.invoiceNo": 1,
      "details.quotationNo": 1,
      createdAt: 1,
      "details.invoiceTitle": 1,
    })
    .toArray();

  console.log("\n=== DOCUMENTS WITH BOTH invoiceNo AND quotationNo NON-EMPTY ===");
  console.log("Total:", bothNonEmpty.length);
  bothNonEmpty.forEach((d) => console.log(JSON.stringify(d)));

  // Total count
  const totalCount = await coll.countDocuments();
  console.log("\nTotal documents in collection:", totalCount);

  await client.close();
}

main().catch(console.error);




