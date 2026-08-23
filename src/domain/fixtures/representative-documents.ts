import type { DocCraftDocument } from '../document/types';

/**
 * Standard 1-page quotation fixture with normal length text and 3 line items.
 */
export const onePageQuotationFixture: DocCraftDocument = {
  id: 'doc-fixture-one-page',
  documentType: 'quotation',
  documentNumber: 'QT-2026-0001',
  issueDate: '2026-08-23',
  dueDate: '2026-09-06',
  business: {
    entityType: 'juristic_person',
    vatStatus: 'registered',
    displayName: 'บริษัท สยาม คราฟต์ โซลูชั่นส์ จำกัด',
    taxId: '0105559012345',
    address: '123/45 อาคารเอ็กซิม ชั้น 12 ถนนพญาไท แขวงทุ่งพญาไท เขตราชเทวี กรุงเทพมหานคร 10400',
    branchType: 'head_office',
  },
  customer: {
    displayName: 'บริษัท นวัตกรรมดิจิทัล สากล จำกัด',
    taxId: '0105561098765',
    address: '99/1 ซอยอารีย์สัมพันธ์ 1 ถนนพหลโยธิน แขวงพญาไท เขตพญาไท กรุงเทพมหานคร 10400',
    branchType: 'branch',
    branchNumber: '00002',
  },
  items: [
    {
      id: 'item-1',
      description: 'ออกแบบระบบและสถาปัตยกรรมซอฟต์แวร์ (Software Architecture Design)',
      quantity: 1,
      unitPrice: 45000,
      discount: { mode: 'none' },
    },
    {
      id: 'item-2',
      description: 'พัฒนาเว็บแอปพลิเคชันส่วนหน้า (Frontend Development — Responsive)',
      quantity: 1,
      unitPrice: 65000,
      discount: { mode: 'percent', value: 10 },
    },
    {
      id: 'item-3',
      description: 'บริการติดตั้งและตั้งค่าระบบคลาวด์เซิร์ฟเวอร์ (Cloud Setup & Deployment)',
      quantity: 2,
      unitPrice: 12500,
      discount: { mode: 'fixed', value: 1000 },
    },
  ],
  adjustments: {
    documentDiscount: { mode: 'fixed', value: 2500 },
    vat: { enabled: true },
    wht: {
      enabled: true,
      ratePercent: 3,
      basisLineItemIds: ['item-1', 'item-2'],
    },
    deposit: { mode: 'percent', value: 50 },
  },
  payment: {
    instructions: 'ธนาคารกสิกรไทย (KBANK)\nเลขที่บัญชี: 123-4-56789-0\nชื่อบัญชี: บจก. สยาม คราฟต์ โซลูชั่นส์',
  },
  blocks: {
    business: true,
    customer: true,
    items: true,
    itemImages: false,
    adjustments: true,
    payment: true,
    terms: true,
    notes: true,
    signatures: true,
  },
  terms: '1. ใบเสนอราคานี้มีผลบังคับใช้ 30 วันนับจากวันที่ออกเอกสาร\n2. กำหนดชำระเงินงวดแรก (มัดจำ) 50% ก่อนเริ่มปฏิบัติงาน\n3. ส่วนที่เหลือชำระภายใน 7 วันหลังจากส่งมอบงานงวดสุดท้าย',
  notes: 'ระยะเวลาดำเนินงานประมาณ 4-6 สัปดาห์นับจากได้รับเงินมัดจำและข้อมูลครบถ้วน',
  schemaVersion: 1,
  createdAt: '2026-08-23T08:00:00.000Z',
  updatedAt: '2026-08-23T08:00:00.000Z',
};

/**
 * Multi-page document fixture with 22 items, extensive terms & notes spanning 2+ A4 pages.
 */
export const multiPageDocumentFixture: DocCraftDocument = {
  id: 'doc-fixture-multi-page',
  documentType: 'invoice',
  documentNumber: 'INV-2026-0888',
  issueDate: '2026-08-23',
  dueDate: '2026-09-22',
  business: {
    entityType: 'juristic_person',
    vatStatus: 'registered',
    displayName: 'บริษัท ไทยเมกะคอนสตรัคชั่น แอนด์ ซัพพลาย จำกัด (มหาชน)',
    taxId: '0107558001234',
    address: '888/99 หมู่ที่ 4 นิคมอุตสาหกรรมบางปู ซอย 12 ถนนสุขุมวิท ตำบลแพรกษา อำเภอเมืองสมุทรปราการ จังหวัดสมุทรปราการ 10280',
    branchType: 'head_office',
  },
  customer: {
    displayName: 'บริษัท กรุงเทพ พัฒนาอสังหาริมทรัพย์ จำกัด',
    taxId: '0105549087654',
    address: '555 อาคารทาวเวอร์ วัน ชั้น 28-30 ถนนวิทยุ แขวงลุมพินี เขตปทุมวัน กรุงเทพมหานคร 10330',
    branchType: 'head_office',
  },
  items: Array.from({ length: 22 }, (_, idx) => {
    const itemNum = idx + 1;
    return {
      id: `multi-item-${itemNum}`,
      description: `รายการพัสดุและอุปกรณ์ก่อสร้าง หมวดที่ ${Math.ceil(itemNum / 5)} ชนิดที่ ${itemNum}: วัสดุปูนซีเมนต์ผสมสำเร็จรูปตราเพชร เกรดงานโครงสร้างพิเศษ ขนาดบรรจุ 50 กก. (Lot #${202600 + itemNum})`,
      quantity: 10 + (itemNum * 5),
      unitPrice: 280 + (itemNum * 15),
      discount: itemNum % 4 === 0 ? { mode: 'percent' as const, value: 5 } : { mode: 'none' as const },
    };
  }),
  adjustments: {
    documentDiscount: { mode: 'percent', value: 3 },
    vat: { enabled: true },
    wht: {
      enabled: false,
      ratePercent: 3,
      basisLineItemIds: [],
    },
    deposit: { mode: 'none' },
  },
  payment: {
    instructions: 'โอนเงินเข้าบัญชีธนาคารกรุงเทพ สาขาสีลม\nเลขที่บัญชี: 101-9-87654-3\nชื่อบัญชี: บมจ. ไทยเมกะคอนสตรัคชั่น แอนด์ ซัพพลาย',
  },
  blocks: {
    business: true,
    customer: true,
    items: true,
    itemImages: false,
    adjustments: true,
    payment: true,
    terms: true,
    notes: true,
    signatures: true,
  },
  terms: '1. กรุณาชำระเงินตามกำหนดเวลาที่ระบุในใบแจ้งหนี้\n2. กรณีชำระเงินล่าช้ากว่ากำหนด บริษัทฯ ขอสงวนสิทธิ์ในการคิดดอกเบี้ยปรับตามอัตราที่กฎหมายกำหนด\n3. สินค้าที่ส่งมอบแล้วไม่สามารถเปลี่ยนหรือคืนได้ ยกเว้นกรณีพบข้อบกพร่องจากการผลิตภายใน 7 วัน\n4. ใบแจ้งหนี้นี้ยังไม่ใช่ใบเสร็จรับเงิน ใบเสร็จรับเงินที่สมบูรณ์จะออกให้เมื่อได้รับการชำระเงินเรียบร้อยแล้ว',
  notes: 'กรุณาส่งหลักฐานการโอนเงิน (Pay-in Slip) พร้อมระบุเลขที่ใบแจ้งหนี้มาที่ accounting@thaimegacon.co.th เพื่อออกใบเสร็จรับเงิน',
  schemaVersion: 1,
  createdAt: '2026-08-23T08:00:00.000Z',
  updatedAt: '2026-08-23T08:00:00.000Z',
};

/**
 * Rich Thai Text fixture with tone marks, complex names, and long text.
 */
export const richThaiTextFixture: DocCraftDocument = {
  id: 'doc-fixture-thai-text',
  documentType: 'receipt',
  documentNumber: 'RC-2569-0042',
  issueDate: '2026-08-23',
  business: {
    entityType: 'individual',
    vatStatus: 'not_registered',
    displayName: 'นายกิตติศักดิ์ พรหมมินทร์ปรีชากุล (ช่างกิต งานอลูมิเนียมและกระจกนิรภัย)',
    taxId: '1100400123456',
    address: '45/89 หมู่บ้านเศรษฐศิลป์ วิลเลจ ซอยสุขุมวิท 101/1 แขวงบางจาก เขตพระโขนง กรุงเทพมหานคร 10260',
  },
  customer: {
    displayName: 'คุณหญิงประไพศรี วรเวชชานนท์ประเสริฐสุข',
    taxId: '3100200987654',
    address: '777/88 ถนนประดิษฐ์มนูธรรม แขวงนวลจันทร์ เขตบึงกุ่ม กรุงเทพมหานคร 10230',
  },
  items: [
    {
      id: 'thai-item-1',
      description: 'งานรื้อถอนและติดตั้งชุดประตูกระจกบานเลื่อนอลูมิเนียมลายไม้สักทอง ขนาด 2.40 x 2.10 เมตร พร้อมมุ้งลวดนิรภัยกันขโมย',
      quantity: 2,
      unitPrice: 28500,
      discount: { mode: 'none' },
    },
    {
      id: 'thai-item-2',
      description: 'งานติดตั้งกระจกเทมเปอร์กั้นห้องอาบน้ำ หนา 10 มม. อุปกรณ์บานพับสแตนเลสสตีล 304 ทรงสี่เหลี่ยมด้านเท่า',
      quantity: 1,
      unitPrice: 16800,
      discount: { mode: 'fixed', value: 800 },
    },
  ],
  adjustments: {
    documentDiscount: { mode: 'none' },
    vat: { enabled: false },
    wht: { enabled: false, ratePercent: 3, basisLineItemIds: [] },
    deposit: { mode: 'none' },
  },
  payment: {
    instructions: 'รับชำระเป็นเงินสด หรือโอนเงินผ่านระบบพร้อมเพย์ (PromptPay)\nเบอร์โทรศัพท์: 081-234-5678 (นายกิตติศักดิ์ พรหมมินทร์ปรีชากุล)',
  },
  blocks: {
    business: true,
    customer: true,
    items: true,
    itemImages: false,
    adjustments: true,
    payment: true,
    terms: true,
    notes: true,
    signatures: true,
  },
  terms: 'รับประกันคุณภาพงานติดตั้งและอุปกรณ์ฟิตติ้งเป็นเวลา 1 ปีเต็มนับตั้งแต่วันส่งมอบงาน',
  notes: 'ได้รับเงินชำระครบถ้วนเรียบร้อยแล้ว ขอขอบพระคุณที่ไว้วางใจใช้บริการ',
  schemaVersion: 1,
  createdAt: '2026-08-23T08:00:00.000Z',
  updatedAt: '2026-08-23T08:00:00.000Z',
};

/**
 * Long Customer / Address and Long Item Description fixture.
 */
export const longCustomerAndAddressFixture: DocCraftDocument = {
  id: 'doc-fixture-long-customer',
  documentType: 'tax_invoice',
  documentNumber: 'TAX-2026-9901',
  issueDate: '2026-08-23',
  dueDate: '2026-09-07',
  business: {
    entityType: 'juristic_person',
    vatStatus: 'registered',
    displayName: 'บริษัท สยามเอนเตอร์ไพรส์อินโนเวชั่นเน็ตเวิร์กแอนด์เทคโนโลยีซิสเต็มส์โกลบอลจำกัด (มหาชน)',
    taxId: '0107560000123',
    address: '999/888 อาคารอินฟินิตี้ทาวเวอร์ คอมเพล็กซ์เซ็นเตอร์ ชั้น 45 โซนซี ถนนวิภาวดีรังสิต แขวงจตุจักร เขตจตุจักร กรุงเทพมหานคร 10900 โทรศัพท์ 0-2123-4567 ต่อ 8901 อีเมล contact@siamenterpriseinnovationglobal.co.th',
    branchType: 'head_office',
  },
  customer: {
    displayName: 'บริษัท ซูเปอร์พรีเมียมโกลบอลโลจิสติกส์อินเตอร์เนชั่นแนลเทรดดิ้งแอนด์ทรานสปอร์ตเตชั่นเซอร์วิสเซส (ประเทศไทย) จำกัด',
    taxId: '0105562099999',
    address: '1234/5678 โครงการนิคมอุตสาหกรรมเอเซีย (สุวรรณภูมิ) อาคารคลังสินค้าและศูนย์กระจายสินค้าแบบควบคุมอุณหภูมิความเย็นพิเศษ ตึกดี ชั้น 3 ห้อง 301-308 หมู่ที่ 11 ถนนสายบางนา-ตราด กม.36 ตำบลบางพลีน้อย อำเภอบางบ่อ จังหวัดสมุทรปราการ 10560',
    branchType: 'branch',
    branchNumber: '00018',
  },
  items: [
    {
      id: 'long-item-1',
      description: 'บริการที่ปรึกษาเชิงกลยุทธ์ด้านการจัดการระบบข้อมูลคลังสินค้าขนาดใหญ่แบบอัตโนมัติด้วยเทคโนโลยีปัญญาประดิษฐ์และอินเทอร์เน็ตของสรรพสิ่ง (Enterprise Automated Cold-Chain Warehouse Intelligence & IoT System Consulting and Continuous Modernization Retainer Service for Fiscal Year 2026-2027) รวมถึงการวิเคราะห์ข้อมูลความจุและประสิทธิภาพการจัดส่งสินค้ารายวัน',
      quantity: 1,
      unitPrice: 350000,
      discount: { mode: 'none' },
    },
  ],
  adjustments: {
    documentDiscount: { mode: 'percent', value: 5 },
    vat: { enabled: true },
    wht: {
      enabled: true,
      ratePercent: 3,
      basisLineItemIds: ['long-item-1'],
    },
    deposit: { mode: 'none' },
  },
  payment: {
    instructions: 'ธนาคารไทยพาณิชย์ จำกัด (มหาชน)\nเลขที่บัญชี: 001-2-34567-8\nชื่อบัญชี: บมจ. สยามเอนเตอร์ไพรส์อินโนเวชั่นเน็ตเวิร์กแอนด์เทคโนโลยีซิสเต็มส์โกลบอล',
  },
  blocks: {
    business: true,
    customer: true,
    items: true,
    itemImages: false,
    adjustments: true,
    payment: true,
    terms: true,
    notes: true,
    signatures: true,
  },
  terms: 'การชำระเงินต้องหักภาษี ณ ที่จ่าย 3% ตามมาตรา 3 เตรส และนำส่งหนังสือรับรองการหักภาษี ณ ที่จ่าย (ใบ 50 ทวิ) ให้แก่บริษัทฯ ภายใน 15 วันทำการ',
  notes: 'เอกสารนี้ออกโดยระบบอิเล็กทรอนิกส์และได้รับการตรวจสอบความถูกต้องแล้ว',
  schemaVersion: 1,
  createdAt: '2026-08-23T08:00:00.000Z',
  updatedAt: '2026-08-23T08:00:00.000Z',
};

/**
 * Fixture with item images enabled.
 */
export const withItemImagesFixture: DocCraftDocument = {
  ...onePageQuotationFixture,
  id: 'doc-fixture-with-images',
  blocks: {
    ...onePageQuotationFixture.blocks,
    itemImages: true,
  },
};

/**
 * Fixture with minimal blocks (optional blocks disabled).
 */
export const minimalBlocksFixture: DocCraftDocument = {
  ...onePageQuotationFixture,
  id: 'doc-fixture-minimal-blocks',
  blocks: {
    business: true,
    customer: false,
    items: true,
    itemImages: false,
    adjustments: true,
    payment: false,
    terms: false,
    notes: false,
    signatures: false,
  },
};
