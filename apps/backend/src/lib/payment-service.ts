import {
  CreateSdkOrderRequest,
  CreateSdkOrderResponse,
  Env,
  MetaInfo,
  OrderStatusResponse,
  StandardCheckoutClient,
} from "pg-sdk-node";
import {
  phonePeClientId,
  phonePeClientSecret,
  phonePeClientVersion,
} from "./env-exporter";

export class PaymentService {
  client: StandardCheckoutClient;

  constructor() {
    this.client = StandardCheckoutClient.getInstance(
      phonePeClientId,
      phonePeClientSecret,
      phonePeClientVersion,
      Env.SANDBOX
    );
  }

  async createPaymentOrder(
    amount: number,
    merchantOrderId: string,
    redirectUrl: string,
    udf1?: string,
    udf2?: string,
    udf3?: string
  ): Promise<CreateSdkOrderResponse & {merchantOrderId: string}> {
    const metaInfo = MetaInfo.builder()
      .udf1(udf1 || "udf1")
      .udf2(udf2 || "udf2")
      .udf3(udf3 || "udf3")
      .build();

    const request = CreateSdkOrderRequest.StandardCheckoutBuilder()
      .merchantOrderId(merchantOrderId)
      .amount(amount)
      .redirectUrl(redirectUrl)
      .metaInfo(metaInfo)
      .build();

    const resp = await this.client.createSdkOrder(request);
    return {...resp, merchantOrderId  };
  }

  async checkOrderStatus(orderId: string): Promise<OrderStatusResponse> {
    const resp = await this.client.getOrderStatus(orderId);
    return resp;
  }

  async cancelOrder(/* params */): Promise<any> {
    // TODO: Implement cancel order logic
  }
}

const paymentService = new PaymentService();
export default paymentService;
