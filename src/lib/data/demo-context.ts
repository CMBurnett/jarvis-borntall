/**
 * Demo context data simulating Sage 100 ERP + Access DB
 * Used as LLM context when live database connections are unavailable.
 *
 * Data domains:
 *  - Customers & contacts
 *  - Sales orders & invoices
 *  - Products & inventory
 *  - Vendors / suppliers
 *  - Accounts receivable & payable
 *  - Purchase orders
 *  - Manufacturing / OEE metrics
 *  - Compliance / ISO audit data
 *  - Employee directory (limited)
 */

// ─── Customers ───────────────────────────────────────────────────────────────

export const customers = [
  {
    id: "CUST-1001",
    name: "Meridian Manufacturing Co.",
    contact: "Laura Chen",
    email: "lchen@meridianmfg.com",
    phone: "(312) 555-0142",
    address: "4501 Industrial Blvd, Chicago, IL 60632",
    terms: "Net 30",
    creditLimit: 150000,
    currentBalance: 47250.0,
    status: "Active",
    since: "2019-03-15",
    lastOrder: "2026-03-10",
    ytdRevenue: 234500.0,
    segment: "Tier 1",
    notes: "Preferred customer. Volume discount 8%. Primary contact prefers email.",
  },
  {
    id: "CUST-1002",
    name: "Apex Industrial Solutions",
    contact: "Marcus Webb",
    email: "mwebb@apexindustrial.com",
    phone: "(614) 555-0387",
    address: "892 Commerce Park Dr, Columbus, OH 43215",
    terms: "Net 45",
    creditLimit: 200000,
    currentBalance: 112800.0,
    status: "Active",
    since: "2017-08-22",
    lastOrder: "2026-03-12",
    ytdRevenue: 389750.0,
    segment: "Tier 1",
    notes: "Largest account by revenue. Quarterly business reviews. PO required for all orders.",
  },
  {
    id: "CUST-1003",
    name: "Great Lakes Fabrication",
    contact: "Diane Torres",
    email: "dtorres@greatlakesfab.com",
    phone: "(216) 555-0219",
    address: "1100 Lakefront Ave, Cleveland, OH 44114",
    terms: "Net 30",
    creditLimit: 75000,
    currentBalance: 23100.0,
    status: "Active",
    since: "2021-01-10",
    lastOrder: "2026-02-28",
    ytdRevenue: 67800.0,
    segment: "Tier 2",
    notes: "Growing account. Interested in expanding to custom assemblies.",
  },
  {
    id: "CUST-1004",
    name: "Pinnacle Precision Parts",
    contact: "Robert Nakamura",
    email: "rnakamura@pinnacleparts.com",
    phone: "(317) 555-0561",
    address: "2200 Precision Way, Indianapolis, IN 46241",
    terms: "Net 30",
    creditLimit: 100000,
    currentBalance: 8450.0,
    status: "Active",
    since: "2020-06-03",
    lastOrder: "2026-03-08",
    ytdRevenue: 145200.0,
    segment: "Tier 1",
    notes: "Strict quality requirements. All shipments require CoC documentation.",
  },
  {
    id: "CUST-1005",
    name: "Summit Supply Chain",
    contact: "Angela Russo",
    email: "arusso@summitsc.com",
    phone: "(502) 555-0733",
    address: "350 Distribution Center Rd, Louisville, KY 40213",
    terms: "Net 60",
    creditLimit: 250000,
    currentBalance: 178500.0,
    status: "Active",
    since: "2018-11-20",
    lastOrder: "2026-03-14",
    ytdRevenue: 412300.0,
    segment: "Tier 1",
    notes: "Distributor account. Resells our products. Special pricing tier applies.",
  },
  {
    id: "CUST-1006",
    name: "Heartland Equipment Corp.",
    contact: "Jim Watkins",
    email: "jwatkins@heartlandequip.com",
    phone: "(816) 555-0482",
    address: "7800 Equipment Ln, Kansas City, MO 64120",
    terms: "Net 30",
    creditLimit: 50000,
    currentBalance: 41200.0,
    status: "On Hold",
    since: "2022-04-12",
    lastOrder: "2026-01-15",
    ytdRevenue: 28900.0,
    segment: "Tier 3",
    notes: "Account on credit hold — past due balance of $41,200. Collections contacted 2026-03-01.",
  },
  {
    id: "CUST-1007",
    name: "Riverfront Automation",
    contact: "Sanjay Patel",
    email: "spatel@riverfrontauto.com",
    phone: "(513) 555-0195",
    address: "560 Riverfront Dr, Cincinnati, OH 45202",
    terms: "Net 30",
    creditLimit: 80000,
    currentBalance: 0,
    status: "Active",
    since: "2023-09-01",
    lastOrder: "2026-03-05",
    ytdRevenue: 52400.0,
    segment: "Tier 2",
    notes: "New automation division customer. High growth potential.",
  },
  {
    id: "CUST-1008",
    name: "Buckeye Metal Works",
    contact: "Patricia Holmes",
    email: "pholmes@buckeyemetal.com",
    phone: "(937) 555-0844",
    address: "1450 Steel St, Dayton, OH 45404",
    terms: "Net 30",
    creditLimit: 60000,
    currentBalance: 15700.0,
    status: "Active",
    since: "2020-11-18",
    lastOrder: "2026-02-20",
    ytdRevenue: 38600.0,
    segment: "Tier 2",
    notes: "Consistent repeat buyer. Primarily orders raw materials.",
  },
  {
    id: "CUST-1009",
    name: "Northstar Engineering",
    contact: "Erik Johansson",
    email: "ejohansson@northstareng.com",
    phone: "(414) 555-0623",
    address: "3300 Innovation Pkwy, Milwaukee, WI 53214",
    terms: "Net 45",
    creditLimit: 120000,
    currentBalance: 67800.0,
    status: "Active",
    since: "2019-07-14",
    lastOrder: "2026-03-11",
    ytdRevenue: 198700.0,
    segment: "Tier 1",
    notes: "Engineering firm. Requires technical drawings with all quotes.",
  },
  {
    id: "CUST-1010",
    name: "Prairie Wind Energy",
    contact: "Michelle Dawson",
    email: "mdawson@prairiewind.com",
    phone: "(515) 555-0371",
    address: "8900 Turbine Rd, Des Moines, IA 50321",
    terms: "Net 30",
    creditLimit: 90000,
    currentBalance: 34500.0,
    status: "Active",
    since: "2024-02-28",
    lastOrder: "2026-03-09",
    ytdRevenue: 87400.0,
    segment: "Tier 2",
    notes: "Renewable energy sector. Government contracts — requires SAM registration docs.",
  },
  {
    id: "CUST-1011",
    name: "Lakeshore Composites",
    contact: "Tom Bradley",
    email: "tbradley@lakeshorecomp.com",
    phone: "(269) 555-0158",
    address: "2100 Composite Dr, Kalamazoo, MI 49001",
    terms: "Net 30",
    creditLimit: 40000,
    currentBalance: 0,
    status: "Inactive",
    since: "2021-05-22",
    lastOrder: "2025-08-14",
    ytdRevenue: 0,
    segment: "Tier 3",
    notes: "Dormant since Aug 2025. Was purchasing composite panels. Winback candidate.",
  },
  {
    id: "CUST-1012",
    name: "Crossroads Logistics",
    contact: "Karen Fitzgerald",
    email: "kfitzgerald@crossroadslog.com",
    phone: "(317) 555-0992",
    address: "5500 Crossroads Blvd, Indianapolis, IN 46236",
    terms: "Net 30",
    creditLimit: 35000,
    currentBalance: 12350.0,
    status: "Active",
    since: "2023-03-10",
    lastOrder: "2026-03-02",
    ytdRevenue: 29800.0,
    segment: "Tier 3",
    notes: "Logistics company. Orders packaging and shipping supplies.",
  },
];

// ─── Products ────────────────────────────────────────────────────────────────

export const products = [
  {
    sku: "STL-PLATE-0250",
    name: 'Steel Plate 1/4"',
    category: "Raw Materials",
    uom: "Sheet",
    unitCost: 85.0,
    unitPrice: 127.5,
    qtyOnHand: 340,
    reorderPoint: 100,
    reorderQty: 200,
    warehouse: "WH-A",
    marginPct: 33.3,
    leadTimeDays: 7,
    lastReceived: "2026-03-05",
    status: "Active",
  },
  {
    sku: "STL-PLATE-0500",
    name: 'Steel Plate 1/2"',
    category: "Raw Materials",
    uom: "Sheet",
    unitCost: 142.0,
    unitPrice: 213.0,
    qtyOnHand: 185,
    reorderPoint: 75,
    reorderQty: 150,
    warehouse: "WH-A",
    marginPct: 33.3,
    leadTimeDays: 7,
    lastReceived: "2026-02-28",
    status: "Active",
  },
  {
    sku: "ALM-BAR-6061",
    name: "Aluminum Bar 6061-T6",
    category: "Raw Materials",
    uom: "Bar",
    unitCost: 34.5,
    unitPrice: 51.75,
    qtyOnHand: 520,
    reorderPoint: 150,
    reorderQty: 300,
    warehouse: "WH-A",
    marginPct: 33.3,
    leadTimeDays: 5,
    lastReceived: "2026-03-10",
    status: "Active",
  },
  {
    sku: "FST-HEX-M10",
    name: "Hex Bolt M10x1.5x50mm Grade 8.8",
    category: "Fasteners",
    uom: "Box (100)",
    unitCost: 12.8,
    unitPrice: 22.4,
    qtyOnHand: 2400,
    reorderPoint: 500,
    reorderQty: 1000,
    warehouse: "WH-B",
    marginPct: 42.9,
    leadTimeDays: 3,
    lastReceived: "2026-03-01",
    status: "Active",
  },
  {
    sku: "FST-NUT-M10",
    name: "Hex Nut M10x1.5 Grade 8",
    category: "Fasteners",
    uom: "Box (100)",
    unitCost: 8.2,
    unitPrice: 14.35,
    qtyOnHand: 3100,
    reorderPoint: 500,
    reorderQty: 1000,
    warehouse: "WH-B",
    marginPct: 42.9,
    leadTimeDays: 3,
    lastReceived: "2026-03-01",
    status: "Active",
  },
  {
    sku: "WLD-WIRE-035",
    name: 'Welding Wire ER70S-6 0.035"',
    category: "Consumables",
    uom: "Spool (44lb)",
    unitCost: 62.0,
    unitPrice: 89.9,
    qtyOnHand: 48,
    reorderPoint: 20,
    reorderQty: 40,
    warehouse: "WH-B",
    marginPct: 31.0,
    leadTimeDays: 4,
    lastReceived: "2026-02-20",
    status: "Active",
  },
  {
    sku: "CUT-DISC-9IN",
    name: 'Cutting Disc 9" x 1/8"',
    category: "Consumables",
    uom: "Box (25)",
    unitCost: 45.0,
    unitPrice: 72.0,
    qtyOnHand: 65,
    reorderPoint: 25,
    reorderQty: 50,
    warehouse: "WH-B",
    marginPct: 37.5,
    leadTimeDays: 3,
    lastReceived: "2026-03-08",
    status: "Active",
  },
  {
    sku: "PNT-IND-BLK",
    name: "Industrial Enamel Paint - Black",
    category: "Coatings",
    uom: "Gallon",
    unitCost: 28.5,
    unitPrice: 45.6,
    qtyOnHand: 92,
    reorderPoint: 30,
    reorderQty: 60,
    warehouse: "WH-C",
    marginPct: 37.5,
    leadTimeDays: 5,
    lastReceived: "2026-02-25",
    status: "Active",
  },
  {
    sku: "ASM-BRKT-A12",
    name: "Mounting Bracket Assembly A12",
    category: "Assemblies",
    uom: "Each",
    unitCost: 24.3,
    unitPrice: 42.5,
    qtyOnHand: 410,
    reorderPoint: 100,
    reorderQty: 250,
    warehouse: "WH-C",
    marginPct: 42.8,
    leadTimeDays: 10,
    lastReceived: "2026-03-03",
    status: "Active",
  },
  {
    sku: "ASM-HINGE-H7",
    name: "Heavy-Duty Hinge Assembly H7",
    category: "Assemblies",
    uom: "Each",
    unitCost: 18.75,
    unitPrice: 32.0,
    qtyOnHand: 275,
    reorderPoint: 75,
    reorderQty: 200,
    warehouse: "WH-C",
    marginPct: 41.4,
    leadTimeDays: 10,
    lastReceived: "2026-03-06",
    status: "Active",
  },
  {
    sku: "PPE-GLOVE-LG",
    name: "Cut-Resistant Gloves (Large)",
    category: "Safety",
    uom: "Pair",
    unitCost: 8.9,
    unitPrice: 15.5,
    qtyOnHand: 180,
    reorderPoint: 50,
    reorderQty: 100,
    warehouse: "WH-B",
    marginPct: 42.6,
    leadTimeDays: 5,
    lastReceived: "2026-02-18",
    status: "Active",
  },
  {
    sku: "STL-TUBE-2IN",
    name: 'Steel Square Tube 2"x2"x0.125"',
    category: "Raw Materials",
    uom: "20ft Length",
    unitCost: 38.0,
    unitPrice: 57.0,
    qtyOnHand: 12,
    reorderPoint: 50,
    reorderQty: 100,
    warehouse: "WH-A",
    marginPct: 33.3,
    leadTimeDays: 7,
    lastReceived: "2026-01-28",
    status: "Low Stock",
  },
  {
    sku: "HYD-CYL-3IN",
    name: '3" Bore Hydraulic Cylinder',
    category: "Components",
    uom: "Each",
    unitCost: 285.0,
    unitPrice: 456.0,
    qtyOnHand: 18,
    reorderPoint: 10,
    reorderQty: 20,
    warehouse: "WH-C",
    marginPct: 37.5,
    leadTimeDays: 14,
    lastReceived: "2026-02-12",
    status: "Active",
  },
  {
    sku: "ELC-MTR-5HP",
    name: "5HP Electric Motor 3-Phase",
    category: "Components",
    uom: "Each",
    unitCost: 420.0,
    unitPrice: 672.0,
    qtyOnHand: 8,
    reorderPoint: 5,
    reorderQty: 10,
    warehouse: "WH-C",
    marginPct: 37.5,
    leadTimeDays: 21,
    lastReceived: "2026-01-15",
    status: "Active",
  },
  {
    sku: "PKG-CRATE-LG",
    name: "Shipping Crate - Large (48x40x36)",
    category: "Packaging",
    uom: "Each",
    unitCost: 42.0,
    unitPrice: 0,
    qtyOnHand: 55,
    reorderPoint: 20,
    reorderQty: 40,
    warehouse: "WH-D",
    marginPct: 0,
    leadTimeDays: 5,
    lastReceived: "2026-03-07",
    status: "Active",
  },
];

// ─── Sales Orders ────────────────────────────────────────────────────────────

export const salesOrders = [
  {
    orderNo: "SO-2026-0312",
    customer: "CUST-1002",
    customerName: "Apex Industrial Solutions",
    orderDate: "2026-03-12",
    requestedShipDate: "2026-03-19",
    status: "Open",
    poNumber: "APX-88421",
    salesRep: "Mike Patterson",
    lines: [
      { sku: "STL-PLATE-0250", qty: 80, unitPrice: 120.0, total: 9600.0 },
      { sku: "STL-PLATE-0500", qty: 40, unitPrice: 200.0, total: 8000.0 },
      { sku: "FST-HEX-M10", qty: 20, unitPrice: 22.4, total: 448.0 },
      { sku: "FST-NUT-M10", qty: 20, unitPrice: 14.35, total: 287.0 },
    ],
    subtotal: 18335.0,
    tax: 1100.1,
    total: 19435.1,
    notes: "Deliver to loading dock B. Call 30 min before arrival.",
  },
  {
    orderNo: "SO-2026-0311",
    customer: "CUST-1009",
    customerName: "Northstar Engineering",
    orderDate: "2026-03-11",
    requestedShipDate: "2026-03-25",
    status: "Open",
    poNumber: "NSE-7742",
    salesRep: "Sarah Kim",
    lines: [
      { sku: "HYD-CYL-3IN", qty: 6, unitPrice: 456.0, total: 2736.0 },
      { sku: "ASM-BRKT-A12", qty: 50, unitPrice: 42.5, total: 2125.0 },
      { sku: "ASM-HINGE-H7", qty: 30, unitPrice: 32.0, total: 960.0 },
    ],
    subtotal: 5821.0,
    tax: 349.26,
    total: 6170.26,
    notes: "Technical drawings attached. Requires inspection cert.",
  },
  {
    orderNo: "SO-2026-0310",
    customer: "CUST-1001",
    customerName: "Meridian Manufacturing Co.",
    orderDate: "2026-03-10",
    requestedShipDate: "2026-03-17",
    status: "In Production",
    poNumber: "",
    salesRep: "Mike Patterson",
    lines: [
      { sku: "ALM-BAR-6061", qty: 100, unitPrice: 47.61, total: 4761.0 },
      { sku: "WLD-WIRE-035", qty: 10, unitPrice: 89.9, total: 899.0 },
      { sku: "CUT-DISC-9IN", qty: 5, unitPrice: 72.0, total: 360.0 },
    ],
    subtotal: 6020.0,
    tax: 361.2,
    total: 6381.2,
    notes: "Volume discount applied (8%). Rush order — expedite if possible.",
  },
  {
    orderNo: "SO-2026-0309",
    customer: "CUST-1010",
    customerName: "Prairie Wind Energy",
    orderDate: "2026-03-09",
    requestedShipDate: "2026-03-23",
    status: "Open",
    poNumber: "PWE-GC-4401",
    salesRep: "Sarah Kim",
    lines: [
      { sku: "STL-PLATE-0500", qty: 60, unitPrice: 213.0, total: 12780.0 },
      { sku: "ELC-MTR-5HP", qty: 4, unitPrice: 672.0, total: 2688.0 },
    ],
    subtotal: 15468.0,
    tax: 928.08,
    total: 16396.08,
    notes: "Government contract. SAM docs on file. Requires country-of-origin cert.",
  },
  {
    orderNo: "SO-2026-0308",
    customer: "CUST-1004",
    customerName: "Pinnacle Precision Parts",
    orderDate: "2026-03-08",
    requestedShipDate: "2026-03-15",
    status: "Shipped",
    poNumber: "PPP-2026-118",
    salesRep: "Mike Patterson",
    lines: [
      { sku: "ASM-BRKT-A12", qty: 200, unitPrice: 42.5, total: 8500.0 },
    ],
    subtotal: 8500.0,
    tax: 510.0,
    total: 9010.0,
    notes: "Certificate of Conformance included. Shipped via FedEx Freight.",
    shipDate: "2026-03-13",
    trackingNo: "FDXF-7782991004",
  },
  {
    orderNo: "SO-2026-0305",
    customer: "CUST-1005",
    customerName: "Summit Supply Chain",
    orderDate: "2026-03-05",
    requestedShipDate: "2026-03-12",
    status: "Shipped",
    poNumber: "SSC-MO-6654",
    salesRep: "Sarah Kim",
    lines: [
      { sku: "STL-PLATE-0250", qty: 200, unitPrice: 108.38, total: 21675.0 },
      { sku: "ALM-BAR-6061", qty: 300, unitPrice: 43.99, total: 13196.25 },
      { sku: "ASM-HINGE-H7", qty: 150, unitPrice: 27.2, total: 4080.0 },
    ],
    subtotal: 38951.25,
    tax: 2337.08,
    total: 41288.33,
    notes: "Distributor pricing applied. LTL shipment — 2 pallets.",
    shipDate: "2026-03-11",
    trackingNo: "XPO-334892",
  },
  {
    orderNo: "SO-2026-0228",
    customer: "CUST-1003",
    customerName: "Great Lakes Fabrication",
    orderDate: "2026-02-28",
    requestedShipDate: "2026-03-07",
    status: "Invoiced",
    poNumber: "",
    salesRep: "Mike Patterson",
    lines: [
      { sku: "STL-TUBE-2IN", qty: 25, unitPrice: 57.0, total: 1425.0 },
      { sku: "WLD-WIRE-035", qty: 4, unitPrice: 89.9, total: 359.6 },
      { sku: "PNT-IND-BLK", qty: 10, unitPrice: 45.6, total: 456.0 },
    ],
    subtotal: 2240.6,
    tax: 134.44,
    total: 2375.04,
    invoiceNo: "INV-2026-0412",
    invoiceDate: "2026-03-07",
  },
  {
    orderNo: "SO-2026-0302",
    customer: "CUST-1012",
    customerName: "Crossroads Logistics",
    orderDate: "2026-03-02",
    requestedShipDate: "2026-03-09",
    status: "Invoiced",
    poNumber: "CRL-0982",
    salesRep: "Sarah Kim",
    lines: [
      { sku: "PKG-CRATE-LG", qty: 30, unitPrice: 65.0, total: 1950.0 },
      { sku: "PPE-GLOVE-LG", qty: 40, unitPrice: 15.5, total: 620.0 },
    ],
    subtotal: 2570.0,
    tax: 154.2,
    total: 2724.2,
    invoiceNo: "INV-2026-0410",
    invoiceDate: "2026-03-09",
  },
];

// ─── Invoices (Accounts Receivable) ──────────────────────────────────────────

export const invoices = [
  {
    invoiceNo: "INV-2026-0412",
    orderNo: "SO-2026-0228",
    customer: "CUST-1003",
    customerName: "Great Lakes Fabrication",
    invoiceDate: "2026-03-07",
    dueDate: "2026-04-06",
    amount: 2375.04,
    paid: 0,
    balance: 2375.04,
    status: "Open",
  },
  {
    invoiceNo: "INV-2026-0410",
    orderNo: "SO-2026-0302",
    customer: "CUST-1012",
    customerName: "Crossroads Logistics",
    invoiceDate: "2026-03-09",
    dueDate: "2026-04-08",
    amount: 2724.2,
    paid: 0,
    balance: 2724.2,
    status: "Open",
  },
  {
    invoiceNo: "INV-2026-0405",
    orderNo: "SO-2026-0220",
    customer: "CUST-1002",
    customerName: "Apex Industrial Solutions",
    invoiceDate: "2026-02-25",
    dueDate: "2026-04-11",
    amount: 45600.0,
    paid: 0,
    balance: 45600.0,
    status: "Open",
  },
  {
    invoiceNo: "INV-2026-0398",
    orderNo: "SO-2026-0210",
    customer: "CUST-1005",
    customerName: "Summit Supply Chain",
    invoiceDate: "2026-02-18",
    dueDate: "2026-04-19",
    amount: 67200.0,
    paid: 67200.0,
    balance: 0,
    status: "Paid",
    paidDate: "2026-03-10",
  },
  {
    invoiceNo: "INV-2026-0392",
    orderNo: "SO-2026-0128",
    customer: "CUST-1009",
    customerName: "Northstar Engineering",
    invoiceDate: "2026-02-05",
    dueDate: "2026-03-22",
    amount: 32400.0,
    paid: 0,
    balance: 32400.0,
    status: "Open",
  },
  {
    invoiceNo: "INV-2026-0380",
    orderNo: "SO-2026-0115",
    customer: "CUST-1006",
    customerName: "Heartland Equipment Corp.",
    invoiceDate: "2026-01-22",
    dueDate: "2026-02-21",
    amount: 28900.0,
    paid: 0,
    balance: 28900.0,
    status: "Past Due",
    daysPastDue: 23,
  },
  {
    invoiceNo: "INV-2026-0375",
    orderNo: "SO-2026-0108",
    customer: "CUST-1006",
    customerName: "Heartland Equipment Corp.",
    invoiceDate: "2026-01-15",
    dueDate: "2026-02-14",
    amount: 12300.0,
    paid: 0,
    balance: 12300.0,
    status: "Past Due",
    daysPastDue: 30,
  },
  {
    invoiceNo: "INV-2026-0370",
    orderNo: "SO-2026-0102",
    customer: "CUST-1001",
    customerName: "Meridian Manufacturing Co.",
    invoiceDate: "2026-01-10",
    dueDate: "2026-02-09",
    amount: 18750.0,
    paid: 18750.0,
    balance: 0,
    status: "Paid",
    paidDate: "2026-02-07",
  },
  {
    invoiceNo: "INV-2026-0365",
    orderNo: "SO-2026-0098",
    customer: "CUST-1004",
    customerName: "Pinnacle Precision Parts",
    invoiceDate: "2026-01-08",
    dueDate: "2026-02-07",
    amount: 8450.0,
    paid: 8450.0,
    balance: 0,
    status: "Paid",
    paidDate: "2026-02-05",
  },
];

// ─── Vendors / Suppliers ─────────────────────────────────────────────────────

export const vendors = [
  {
    id: "VND-2001",
    name: "American Steel Distributors",
    contact: "Frank Morrison",
    email: "fmorrison@amsteeldist.com",
    phone: "(219) 555-0347",
    address: "1800 Steel Mill Rd, Gary, IN 46402",
    terms: "Net 30",
    status: "Approved",
    rating: "A",
    primaryProducts: ["Steel plates", "Steel tubes", "Steel bars"],
    leadTimeDays: 7,
    onTimeDeliveryPct: 94.2,
    qualityRejectPct: 0.8,
    notes: "Primary steel supplier. Price locked through Q2 2026.",
    lastAudit: "2025-11-15",
    isoCompliant: true,
  },
  {
    id: "VND-2002",
    name: "Midwest Aluminum Supply",
    contact: "Grace Lin",
    email: "glin@midwestalum.com",
    phone: "(574) 555-0218",
    address: "450 Alloy Way, Elkhart, IN 46516",
    terms: "Net 30",
    status: "Approved",
    rating: "A",
    primaryProducts: ["Aluminum bars", "Aluminum sheets", "Aluminum extrusions"],
    leadTimeDays: 5,
    onTimeDeliveryPct: 97.1,
    qualityRejectPct: 0.3,
    notes: "Excellent quality and delivery performance. Preferred aluminum source.",
    lastAudit: "2025-09-20",
    isoCompliant: true,
  },
  {
    id: "VND-2003",
    name: "FastenAll Industrial",
    contact: "Dave Kowalski",
    email: "dkowalski@fastenall-ind.com",
    phone: "(260) 555-0490",
    address: "3200 Hardware Blvd, Fort Wayne, IN 46802",
    terms: "Net 30",
    status: "Approved",
    rating: "B+",
    primaryProducts: ["Hex bolts", "Nuts", "Washers", "Screws", "Anchors"],
    leadTimeDays: 3,
    onTimeDeliveryPct: 91.5,
    qualityRejectPct: 1.2,
    notes: "Good pricing on bulk fastener orders. Occasional short shipments.",
    lastAudit: "2025-12-01",
    isoCompliant: true,
  },
  {
    id: "VND-2004",
    name: "WeldPro Consumables",
    contact: "Tony Reeves",
    email: "treeves@weldpro.com",
    phone: "(812) 555-0632",
    address: "700 Arc Ln, Evansville, IN 47710",
    terms: "Net 30",
    status: "Approved",
    rating: "A-",
    primaryProducts: ["Welding wire", "Electrodes", "Shielding gas", "Cutting discs"],
    leadTimeDays: 4,
    onTimeDeliveryPct: 95.8,
    qualityRejectPct: 0.5,
    notes: "Sole source for ER70S-6 welding wire. Competitive pricing.",
    lastAudit: "2026-01-10",
    isoCompliant: true,
  },
  {
    id: "VND-2005",
    name: "Coatings Plus LLC",
    contact: "Beth Simmons",
    email: "bsimmons@coatingsplus.com",
    phone: "(765) 555-0873",
    address: "1100 Paint Way, Muncie, IN 47302",
    terms: "Net 45",
    status: "Approved",
    rating: "B",
    primaryProducts: ["Industrial paints", "Powder coatings", "Primers", "Sealants"],
    leadTimeDays: 5,
    onTimeDeliveryPct: 88.3,
    qualityRejectPct: 1.8,
    notes: "Delivery performance declining. Discussing SLA improvements in next QBR.",
    lastAudit: "2025-10-05",
    isoCompliant: false,
    supplierAlert:
      "ALERT: On-time delivery dropped below 90% threshold. Corrective action requested 2026-02-15.",
  },
  {
    id: "VND-2006",
    name: "Hydraulics International",
    contact: "Ray Nguyen",
    email: "rnguyen@hydraulicsintl.com",
    phone: "(513) 555-0445",
    address: "2800 Fluid Power Dr, Cincinnati, OH 45241",
    terms: "Net 30",
    status: "Approved",
    rating: "A",
    primaryProducts: ["Hydraulic cylinders", "Pumps", "Valves", "Hoses"],
    leadTimeDays: 14,
    onTimeDeliveryPct: 96.5,
    qualityRejectPct: 0.2,
    notes: "Premium supplier. Higher cost but excellent quality and support.",
    lastAudit: "2026-02-01",
    isoCompliant: true,
  },
  {
    id: "VND-2007",
    name: "MotorTech Electric",
    contact: "Sandy Crawford",
    email: "scrawford@motortech.com",
    phone: "(937) 555-0719",
    address: "900 Motor Ave, Springfield, OH 45505",
    terms: "Net 30",
    status: "Approved",
    rating: "B+",
    primaryProducts: ["Electric motors", "Drives", "Controls", "Starters"],
    leadTimeDays: 21,
    onTimeDeliveryPct: 89.0,
    qualityRejectPct: 0.9,
    notes: "Long lead times on 5HP+ motors. Exploring alternate source.",
    lastAudit: "2025-08-22",
    isoCompliant: true,
    supplierAlert:
      "ALERT: Last audit >6 months ago. Re-audit due by 2026-03-31.",
  },
];

// ─── Purchase Orders ─────────────────────────────────────────────────────────

export const purchaseOrders = [
  {
    poNumber: "PO-2026-0085",
    vendor: "VND-2001",
    vendorName: "American Steel Distributors",
    orderDate: "2026-03-10",
    expectedDelivery: "2026-03-17",
    status: "Open",
    lines: [
      { sku: "STL-PLATE-0250", qty: 200, unitCost: 85.0, total: 17000.0 },
      { sku: "STL-TUBE-2IN", qty: 100, unitCost: 38.0, total: 3800.0 },
    ],
    total: 20800.0,
    notes: "Replenishing low stock on steel tubes. Standard delivery.",
  },
  {
    poNumber: "PO-2026-0084",
    vendor: "VND-2002",
    vendorName: "Midwest Aluminum Supply",
    orderDate: "2026-03-08",
    expectedDelivery: "2026-03-13",
    status: "Received",
    lines: [
      { sku: "ALM-BAR-6061", qty: 300, unitCost: 34.5, total: 10350.0 },
    ],
    total: 10350.0,
    receivedDate: "2026-03-10",
    notes: "Received on time. QC passed.",
  },
  {
    poNumber: "PO-2026-0083",
    vendor: "VND-2006",
    vendorName: "Hydraulics International",
    orderDate: "2026-03-01",
    expectedDelivery: "2026-03-15",
    status: "Open",
    lines: [
      { sku: "HYD-CYL-3IN", qty: 20, unitCost: 285.0, total: 5700.0 },
    ],
    total: 5700.0,
    notes: "For Northstar Engineering order. Priority shipment requested.",
  },
  {
    poNumber: "PO-2026-0082",
    vendor: "VND-2007",
    vendorName: "MotorTech Electric",
    orderDate: "2026-02-20",
    expectedDelivery: "2026-03-13",
    status: "Late",
    lines: [
      { sku: "ELC-MTR-5HP", qty: 10, unitCost: 420.0, total: 4200.0 },
    ],
    total: 4200.0,
    notes: "LATE: Expected 3/13, not yet received. Vendor says shipping 3/17.",
  },
];

// ─── Accounts Payable ────────────────────────────────────────────────────────

export const accountsPayable = [
  {
    vendor: "VND-2001",
    vendorName: "American Steel Distributors",
    openBalance: 34500.0,
    bills: [
      { billNo: "ASD-INV-4421", amount: 17200.0, dueDate: "2026-03-25", status: "Open" },
      { billNo: "ASD-INV-4398", amount: 17300.0, dueDate: "2026-03-15", status: "Due Today" },
    ],
  },
  {
    vendor: "VND-2002",
    vendorName: "Midwest Aluminum Supply",
    openBalance: 10350.0,
    bills: [
      { billNo: "MAS-77201", amount: 10350.0, dueDate: "2026-04-08", status: "Open" },
    ],
  },
  {
    vendor: "VND-2004",
    vendorName: "WeldPro Consumables",
    openBalance: 5480.0,
    bills: [
      { billNo: "WP-2026-0332", amount: 5480.0, dueDate: "2026-03-20", status: "Open" },
    ],
  },
  {
    vendor: "VND-2005",
    vendorName: "Coatings Plus LLC",
    openBalance: 3200.0,
    bills: [
      { billNo: "CP-88712", amount: 3200.0, dueDate: "2026-03-02", status: "Past Due" },
    ],
  },
  {
    vendor: "VND-2006",
    vendorName: "Hydraulics International",
    openBalance: 5700.0,
    bills: [
      { billNo: "HI-INV-9034", amount: 5700.0, dueDate: "2026-03-31", status: "Open" },
    ],
  },
];

// ─── Manufacturing / OEE Metrics ─────────────────────────────────────────────

export const productionLines = [
  {
    lineId: "LINE-01",
    name: "CNC Machining Center",
    currentJob: "SO-2026-0310 (Meridian Mfg - Aluminum Bars)",
    status: "Running",
    operator: "Carlos Rivera",
    shift: "1st (6:00 AM - 2:30 PM)",
  },
  {
    lineId: "LINE-02",
    name: "Laser Cutting Station",
    currentJob: "SO-2026-0312 (Apex Industrial - Steel Plates)",
    status: "Running",
    operator: "Jen Hargrove",
    shift: "1st (6:00 AM - 2:30 PM)",
  },
  {
    lineId: "LINE-03",
    name: "Welding Cell A",
    currentJob: "SO-2026-0311 (Northstar Eng - Bracket Assembly)",
    status: "Running",
    operator: "Ahmad Hassan",
    shift: "1st (6:00 AM - 2:30 PM)",
  },
  {
    lineId: "LINE-04",
    name: "Paint / Coating Booth",
    currentJob: "None",
    status: "Idle",
    operator: "Unassigned",
    shift: "1st (6:00 AM - 2:30 PM)",
  },
  {
    lineId: "LINE-05",
    name: "Assembly Station",
    currentJob: "Stock Build - ASM-BRKT-A12",
    status: "Running",
    operator: "Maria Santos",
    shift: "1st (6:00 AM - 2:30 PM)",
  },
];

export const oeeMetrics = {
  period: "2026-03-01 to 2026-03-15",
  overall: {
    availability: 91.2,
    performance: 87.5,
    quality: 98.1,
    oee: 78.3,
  },
  byLine: [
    {
      lineId: "LINE-01",
      name: "CNC Machining Center",
      availability: 93.5,
      performance: 89.2,
      quality: 99.1,
      oee: 82.6,
      downtime: { planned: 8.5, unplanned: 3.2, topReason: "Tool change" },
    },
    {
      lineId: "LINE-02",
      name: "Laser Cutting Station",
      availability: 95.1,
      performance: 91.8,
      quality: 98.7,
      oee: 86.2,
      downtime: { planned: 4.0, unplanned: 1.2, topReason: "Material loading" },
    },
    {
      lineId: "LINE-03",
      name: "Welding Cell A",
      availability: 88.4,
      performance: 84.0,
      quality: 97.2,
      oee: 72.2,
      downtime: { planned: 6.0, unplanned: 8.5, topReason: "Wire feed jam" },
    },
    {
      lineId: "LINE-04",
      name: "Paint / Coating Booth",
      availability: 82.0,
      performance: 79.5,
      quality: 96.8,
      oee: 63.1,
      downtime: {
        planned: 10.0,
        unplanned: 12.0,
        topReason: "Booth filter replacement",
      },
    },
    {
      lineId: "LINE-05",
      name: "Assembly Station",
      availability: 94.8,
      performance: 92.0,
      quality: 99.4,
      oee: 86.7,
      downtime: { planned: 3.0, unplanned: 2.1, topReason: "Parts shortage" },
    },
  ],
  trends: {
    weekly: [
      { week: "2026-W08", oee: 76.1 },
      { week: "2026-W09", oee: 77.8 },
      { week: "2026-W10", oee: 79.5 },
      { week: "2026-W11", oee: 78.3 },
    ],
    monthly: [
      { month: "2025-10", oee: 74.2 },
      { month: "2025-11", oee: 75.8 },
      { month: "2025-12", oee: 73.1 },
      { month: "2026-01", oee: 76.5 },
      { month: "2026-02", oee: 77.9 },
      { month: "2026-03", oee: 78.3 },
    ],
  },
};

// ─── Compliance / ISO Audit Data ─────────────────────────────────────────────

export const complianceGaps = [
  {
    id: "GAP-001",
    standard: "ISO 9001:2015",
    clause: "7.1.5",
    area: "Monitoring & Measuring Resources",
    severity: "Critical",
    description: "Calibration records missing for 3 of 12 torque wrenches in welding cell.",
    assignee: "Quality Manager - Tom Chen",
    dueDate: "2026-03-20",
    status: "In Progress",
    notes: "Wrenches sent to external lab 3/10. Results expected 3/18.",
  },
  {
    id: "GAP-002",
    standard: "ISO 9001:2015",
    clause: "8.5.2",
    area: "Identification & Traceability",
    severity: "High",
    description: "Lot traceability incomplete for steel plate inventory received in Feb 2026.",
    assignee: "Warehouse Lead - Derek Owens",
    dueDate: "2026-03-18",
    status: "In Progress",
    notes: "Cross-referencing mill certs with receiving logs. 60% complete.",
  },
  {
    id: "GAP-003",
    standard: "ISO 14001:2015",
    clause: "6.1.2",
    area: "Environmental Aspects",
    severity: "High",
    description: "Waste oil disposal log not updated since January. Missing 6 entries.",
    assignee: "EHS Coordinator - Nina Patel",
    dueDate: "2026-03-15",
    status: "Past Due",
    notes: "Disposal vendor confirming pickup dates. Should close by 3/17.",
  },
  {
    id: "GAP-004",
    standard: "ISO 9001:2015",
    clause: "7.2",
    area: "Competence",
    severity: "Medium",
    description: "Annual welding certification renewal overdue for 2 operators.",
    assignee: "HR Manager - Lisa Park",
    dueDate: "2026-03-25",
    status: "Open",
    notes: "Testing scheduled for 3/22 with certified examiner.",
  },
  {
    id: "GAP-005",
    standard: "ISO 9001:2015",
    clause: "8.7",
    area: "Control of Nonconforming Outputs",
    severity: "Medium",
    description: "NCR-2026-014 disposition not recorded. Parts quarantined but no formal review completed.",
    assignee: "Quality Manager - Tom Chen",
    dueDate: "2026-03-19",
    status: "Open",
    notes: "MRB meeting scheduled 3/17 to review.",
  },
  {
    id: "GAP-006",
    standard: "ISO 14001:2015",
    clause: "8.1",
    area: "Operational Planning & Control",
    severity: "Medium",
    description: "Spill containment inspection checklist not completed for paint booth area in March.",
    assignee: "EHS Coordinator - Nina Patel",
    dueDate: "2026-03-16",
    status: "Past Due",
    notes: "Inspection being completed today.",
  },
  {
    id: "GAP-007",
    standard: "ISO 9001:2015",
    clause: "9.1.3",
    area: "Analysis & Evaluation",
    severity: "Medium",
    description: "Q1 2026 customer satisfaction survey not yet distributed.",
    assignee: "Sales Manager - Karen Fields",
    dueDate: "2026-03-31",
    status: "Open",
    notes: "Survey drafted, pending management approval.",
  },
  {
    id: "GAP-008",
    standard: "ISO 9001:2015",
    clause: "10.2",
    area: "Nonconformity & Corrective Action",
    severity: "High",
    description: "CAPA for supplier reject (VND-2005 paint defects) not initiated within 5-day SLA.",
    assignee: "Quality Manager - Tom Chen",
    dueDate: "2026-03-14",
    status: "Past Due",
    notes: "CAPA form submitted 3/15. Root cause analysis in progress.",
  },
  {
    id: "GAP-009",
    standard: "ISO 9001:2015",
    clause: "7.5",
    area: "Documented Information",
    severity: "Low",
    description: "Work instruction WI-042 (CNC setup) references obsolete revision of drawing DWG-1185.",
    assignee: "Engineering - Brian Yates",
    dueDate: "2026-04-01",
    status: "Open",
    notes: "Drawing updated. WI revision pending review.",
  },
  {
    id: "GAP-010",
    standard: "ISO 14001:2015",
    clause: "9.1.2",
    area: "Compliance Evaluation",
    severity: "Low",
    description: "Annual environmental compliance self-assessment for 2025 not yet finalized.",
    assignee: "EHS Coordinator - Nina Patel",
    dueDate: "2026-03-31",
    status: "In Progress",
    notes: "Draft 80% complete. Awaiting air permit renewal confirmation.",
  },
];

export const auditReadiness = {
  overallScore: 73,
  nextAuditDate: "2026-06-15",
  auditor: "BSI Group",
  auditType: "Surveillance Audit (ISO 9001 + 14001)",
  gapSummary: {
    total: 10,
    critical: 1,
    high: 3,
    medium: 4,
    low: 2,
    pastDue: 3,
    inProgress: 3,
    open: 4,
  },
  readinessByClause: [
    { clause: "4 - Context", score: 90 },
    { clause: "5 - Leadership", score: 85 },
    { clause: "6 - Planning", score: 72 },
    { clause: "7 - Support", score: 68 },
    { clause: "8 - Operation", score: 70 },
    { clause: "9 - Performance Evaluation", score: 65 },
    { clause: "10 - Improvement", score: 60 },
  ],
};

// ─── Employee Directory (Operations) ─────────────────────────────────────────

export const employees = [
  { name: "Tom Chen", role: "Quality Manager", dept: "Quality", email: "tchen@company.com" },
  { name: "Nina Patel", role: "EHS Coordinator", dept: "Safety", email: "npatel@company.com" },
  { name: "Derek Owens", role: "Warehouse Lead", dept: "Warehouse", email: "dowens@company.com" },
  { name: "Lisa Park", role: "HR Manager", dept: "Human Resources", email: "lpark@company.com" },
  { name: "Karen Fields", role: "Sales Manager", dept: "Sales", email: "kfields@company.com" },
  { name: "Mike Patterson", role: "Sales Rep - Midwest", dept: "Sales", email: "mpatterson@company.com" },
  { name: "Sarah Kim", role: "Sales Rep - East", dept: "Sales", email: "skim@company.com" },
  { name: "Brian Yates", role: "Manufacturing Engineer", dept: "Engineering", email: "byates@company.com" },
  { name: "Carlos Rivera", role: "CNC Operator", dept: "Production", email: "crivera@company.com" },
  { name: "Jen Hargrove", role: "Laser Operator", dept: "Production", email: "jhargrove@company.com" },
  { name: "Ahmad Hassan", role: "Lead Welder", dept: "Production", email: "ahassan@company.com" },
  { name: "Maria Santos", role: "Assembly Tech", dept: "Production", email: "msantos@company.com" },
  { name: "Steve Brennan", role: "Plant Manager", dept: "Operations", email: "sbrennan@company.com" },
  { name: "Raj Mehta", role: "IT Manager", dept: "IT", email: "rmehta@company.com" },
];

// ─── Financial Summary ───────────────────────────────────────────────────────

export const financialSummary = {
  period: "YTD through 2026-03-15",
  revenue: {
    ytd: 1685350.0,
    priorYearYtd: 1423800.0,
    growthPct: 18.4,
    byMonth: [
      { month: "2026-01", revenue: 498200.0 },
      { month: "2026-02", revenue: 572650.0 },
      { month: "2026-03", revenue: 614500.0, note: "Projected full month" },
    ],
  },
  costOfGoodsSold: {
    ytd: 1077020.0,
    grossMarginPct: 36.1,
  },
  accountsReceivable: {
    totalOutstanding: 527275.04,
    current: 413975.04,
    pastDue30: 71800.0,
    pastDue60: 41200.0,
    pastDue90: 300.0,
    dso: 38, // days sales outstanding
  },
  accountsPayable: {
    totalOutstanding: 59230.0,
    current: 56030.0,
    pastDue: 3200.0,
  },
  topCustomersByRevenue: [
    { customer: "Summit Supply Chain", revenue: 412300.0, pct: 24.5 },
    { customer: "Apex Industrial Solutions", revenue: 389750.0, pct: 23.1 },
    { customer: "Northstar Engineering", revenue: 198700.0, pct: 11.8 },
    { customer: "Pinnacle Precision Parts", revenue: 145200.0, pct: 8.6 },
    { customer: "Meridian Manufacturing Co.", revenue: 234500.0, pct: 13.9 },
  ],
  topProductsByRevenue: [
    { product: 'Steel Plate 1/4"', sku: "STL-PLATE-0250", revenue: 312400.0 },
    { product: 'Steel Plate 1/2"', sku: "STL-PLATE-0500", revenue: 278900.0 },
    { product: "Mounting Bracket Assembly A12", sku: "ASM-BRKT-A12", revenue: 198500.0 },
    { product: "Aluminum Bar 6061-T6", sku: "ALM-BAR-6061", revenue: 167300.0 },
    { product: "5HP Electric Motor 3-Phase", sku: "ELC-MTR-5HP", revenue: 134400.0 },
  ],
};

// ─── Order Processing / Email Queue ──────────────────────────────────────────

export const emailOrderQueue = [
  {
    id: "EMQ-001",
    from: "lchen@meridianmfg.com",
    subject: "Re: Q2 Aluminum Order",
    receivedAt: "2026-03-15T09:22:00Z",
    status: "Parsed",
    parsedItems: [
      { description: "Aluminum Bar 6061-T6", matchedSku: "ALM-BAR-6061", qty: 150, confidence: 0.98 },
      { description: "Welding Wire 0.035", matchedSku: "WLD-WIRE-035", qty: 8, confidence: 0.95 },
    ],
    pricingMatch: true,
    autoApproved: true,
    generatedOrder: "SO-2026-0315 (pending)",
  },
  {
    id: "EMQ-002",
    from: "mwebb@apexindustrial.com",
    subject: "PO APX-88450 - Hydraulic cylinders + custom brackets",
    receivedAt: "2026-03-15T10:45:00Z",
    status: "Exception",
    parsedItems: [
      { description: "3-inch hydraulic cylinder", matchedSku: "HYD-CYL-3IN", qty: 12, confidence: 0.92 },
      { description: "Custom L-bracket 6x4", matchedSku: null, qty: 100, confidence: 0.0 },
    ],
    pricingMatch: false,
    autoApproved: false,
    exceptionReason: "Unrecognized item: 'Custom L-bracket 6x4'. Price mismatch on HYD-CYL-3IN ($440 vs list $456).",
  },
  {
    id: "EMQ-003",
    from: "spatel@riverfrontauto.com",
    subject: "Order - Fasteners and safety gloves",
    receivedAt: "2026-03-15T11:30:00Z",
    status: "Parsed",
    parsedItems: [
      { description: "M10 hex bolts box of 100", matchedSku: "FST-HEX-M10", qty: 10, confidence: 0.97 },
      { description: "M10 hex nuts box of 100", matchedSku: "FST-NUT-M10", qty: 10, confidence: 0.97 },
      { description: "Large cut resistant gloves", matchedSku: "PPE-GLOVE-LG", qty: 24, confidence: 0.93 },
    ],
    pricingMatch: true,
    autoApproved: true,
    generatedOrder: "SO-2026-0316 (pending)",
  },
  {
    id: "EMQ-004",
    from: "dtorres@greatlakesfab.com",
    subject: "Fwd: Need quote on large plate order",
    receivedAt: "2026-03-15T13:15:00Z",
    status: "Review",
    parsedItems: [
      { description: '1/2" steel plate', matchedSku: "STL-PLATE-0500", qty: 100, confidence: 0.96 },
    ],
    pricingMatch: true,
    autoApproved: false,
    exceptionReason: "Order value ($21,300) exceeds customer credit limit ($75,000) given current balance ($23,100). Requires credit review.",
  },
];

// ─── Context Builder ─────────────────────────────────────────────────────────

/**
 * Builds a formatted context string for injection into the LLM system prompt.
 * Can be filtered by domain to keep token usage manageable.
 */
export function buildDemoContext(
  domains: (
    | "all"
    | "customers"
    | "products"
    | "sales"
    | "invoices"
    | "vendors"
    | "purchaseOrders"
    | "payables"
    | "manufacturing"
    | "compliance"
    | "employees"
    | "financials"
    | "emailQueue"
  )[] = ["all"]
): string {
  const include = (d: string) => domains.includes("all") || domains.includes(d as never);

  const sections: string[] = [
    "=== BUSINESS DATA CONTEXT (Sage 100 + Access DB) ===",
    `Data as of: 2026-03-15`,
    "",
  ];

  if (include("customers")) {
    sections.push("--- CUSTOMERS ---");
    sections.push(JSON.stringify(customers, null, 2));
    sections.push("");
  }

  if (include("products")) {
    sections.push("--- PRODUCTS & INVENTORY ---");
    sections.push(JSON.stringify(products, null, 2));
    sections.push("");
  }

  if (include("sales")) {
    sections.push("--- SALES ORDERS ---");
    sections.push(JSON.stringify(salesOrders, null, 2));
    sections.push("");
  }

  if (include("invoices")) {
    sections.push("--- INVOICES (ACCOUNTS RECEIVABLE) ---");
    sections.push(JSON.stringify(invoices, null, 2));
    sections.push("");
  }

  if (include("vendors")) {
    sections.push("--- VENDORS / SUPPLIERS ---");
    sections.push(JSON.stringify(vendors, null, 2));
    sections.push("");
  }

  if (include("purchaseOrders")) {
    sections.push("--- PURCHASE ORDERS ---");
    sections.push(JSON.stringify(purchaseOrders, null, 2));
    sections.push("");
  }

  if (include("payables")) {
    sections.push("--- ACCOUNTS PAYABLE ---");
    sections.push(JSON.stringify(accountsPayable, null, 2));
    sections.push("");
  }

  if (include("manufacturing")) {
    sections.push("--- PRODUCTION LINES ---");
    sections.push(JSON.stringify(productionLines, null, 2));
    sections.push("");
    sections.push("--- OEE METRICS ---");
    sections.push(JSON.stringify(oeeMetrics, null, 2));
    sections.push("");
  }

  if (include("compliance")) {
    sections.push("--- COMPLIANCE GAPS ---");
    sections.push(JSON.stringify(complianceGaps, null, 2));
    sections.push("");
    sections.push("--- AUDIT READINESS ---");
    sections.push(JSON.stringify(auditReadiness, null, 2));
    sections.push("");
  }

  if (include("employees")) {
    sections.push("--- EMPLOYEE DIRECTORY ---");
    sections.push(JSON.stringify(employees, null, 2));
    sections.push("");
  }

  if (include("financials")) {
    sections.push("--- FINANCIAL SUMMARY ---");
    sections.push(JSON.stringify(financialSummary, null, 2));
    sections.push("");
  }

  if (include("emailQueue")) {
    sections.push("--- EMAIL ORDER QUEUE ---");
    sections.push(JSON.stringify(emailOrderQueue, null, 2));
    sections.push("");
  }

  return sections.join("\n");
}
