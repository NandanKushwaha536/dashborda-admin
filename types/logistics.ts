export type ApiEnvelope<T> = {success?:boolean;message?:string;data?:T};
export type Page<T> = {data:T[];total:number;page:number;limit:number;totalPages:number};
export type Shipment = {
  _id:string; shipmentNumber:string; 
  order?:{_id?:string;orderNumber?:string;orderStatus?:string;paymentStatus?:string;total?:number}|string;
  status:string; carrier?:string; awbNumber?:string; trackingNumber?:string; trackingUrl?:string; labelUrl?:string;
  provider?:string; service?:string; shippingMethod?:string; codAmount?:number; ndrReason?:string; failureReason?:string;
  package?:{packageCount?:number;weightKg?:number;lengthCm?:number;widthCm?:number;heightCm?:number;volumetricWeightKg?:number};
  charges?:{shipping?:number;cod?:number;insurance?:number;total?:number};
  financials?:{customerShippingCollected?:number;courierCost?:number;logisticsServiceFee?:number;sellerPayable?:number};
  shippingAddress?:{name?:string;phone?:string;addressLine1?:string;addressLine2?:string;city?:string;state?:string;postalCode?:string;country?:string};
  items?:{sku:string;name:string;quantity:number;product?:string}[];
  trackingEvents?:{status:string;location?:string;description?:string;occurredAt:string}[];
  createdAt?:string;updatedAt?:string;deliveredAt?:string;
};
export type Dashboard={totalShipments:number;pending:number;inTransit:number;delivered:number;rto:number;ndr:number;pickupPending:number;failedShipments:number;financials:{customerShippingCollected:number;courierCost:number;logisticsServiceFee:number;sellerPayable:number;codAmount:number};recent:Shipment[]};
export type Provider={_id?:string;name?:string;provider?:string;status?:string;events?:unknown;metadata?:{channel?:string}};
export type Warehouse={_id:string;name:string;code:string;status:string;email?:string;phone?:string;gst?:string;country?:string;address?:{line1?:string;city?:string;area?:string;state?:string;postalCode?:string;country?:string}};

export type FulfillmentStatus = "PENDING"|"PICKING"|"PICKED"|"PACKING"|"PACKED"|"CANCELLED";
export type FulfillmentTask = {
  _id:string; taskNumber?:string; status:FulfillmentStatus; order?:string|{_id?:string;orderNumber?:string};
  warehouse?:string|{_id?:string;name?:string;code?:string}; assignedTo?:string;
  packagingType?:string; packageCount?:number; expectedWeight?:number; actualWeight?:number;
  packingVerifiedBy?:string; startedAt?:string; completedAt?:string;
};

export type InventoryRow = { _id?:string; product?:{name?:string;sku?:string}|string; name?:string; sku?:string; available?:number; quantity?:number; reserved?:number; status?:string };
export type ReturnRow = { _id?:string; returnNumber?:string; status?:string };

export type PickupAddressForm = { name:string; email:string; phone:string; gst:string; pincode:string; city:string; area:string; state:string; warehouseName:string; country:string; address1:string; status:"ACTIVE"|"INACTIVE" };
export type PickupRequestForm = { courierName:string; warehouseId:string; weightKg:string; expectedPackages:string; pickupDate:string; pickupTime:string };
export type ShipmentForm = { referenceNo:string; actualWeightKg:string; awb:string; shipmentType:"Forward"|"Reverse"; paymentMode:"PREPAID"|"COD"; pickupAddressId:string; rtoSameAsPickup:boolean; rtoAddress:string; rtoPincode:string; rtoCity:string; rtoState:string; rtoArea:string; rtoCountry:string; phone:string; alternatePhone:string; email:string; receiverName:string; address:string; landmark:string; pincode:string; area:string; city:string; state:string; country:string; ewayBillNo:string; invoiceNo:string; invoiceAmount:string; invoiceDate:string; productDescription:string; hsn:string; gstPercent:string; boxes:Array<{count:string;length:string;height:string;width:string}>; };
export type RemittanceRow = { _id?:string; remittanceId?:string; amount?:number; shipmentCount?:number; paymentDate?:string; status?:string };
export type DisputeRow = { _id?:string; refNo?:string; awb?:string; receiverName?:string; phone?:string; deliveryDate?:string; charges?:number; courierWeight?:number; remWeight?:number; courier?:string; status?:string };
