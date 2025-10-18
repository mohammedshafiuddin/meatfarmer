"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const pg_sdk_node_1 = require("pg-sdk-node");
const env_exporter_1 = require("./env-exporter");
class PaymentService {
    constructor() {
        this.client = pg_sdk_node_1.StandardCheckoutClient.getInstance(env_exporter_1.phonePeClientId, env_exporter_1.phonePeClientSecret, env_exporter_1.phonePeClientVersion, pg_sdk_node_1.Env.SANDBOX);
    }
    async createPaymentOrder(amount, merchantOrderId, redirectUrl, udf1, udf2, udf3) {
        const metaInfo = pg_sdk_node_1.MetaInfo.builder()
            .udf1(udf1 || "udf1")
            .udf2(udf2 || "udf2")
            .udf3(udf3 || "udf3")
            .build();
        const request = pg_sdk_node_1.CreateSdkOrderRequest.StandardCheckoutBuilder()
            .merchantOrderId(merchantOrderId)
            .amount(amount)
            .redirectUrl(redirectUrl)
            .metaInfo(metaInfo)
            .build();
        const resp = await this.client.createSdkOrder(request);
        return { ...resp, merchantOrderId };
    }
    async checkOrderStatus(orderId) {
        const resp = await this.client.getOrderStatus(orderId);
        return resp;
    }
    async cancelOrder( /* params */) {
        // TODO: Implement cancel order logic
    }
}
exports.PaymentService = PaymentService;
const paymentService = new PaymentService();
exports.default = paymentService;
