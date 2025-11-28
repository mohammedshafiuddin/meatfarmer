import React from "react";
import { View, ScrollView, TouchableOpacity, Image, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AppContainer, MyText, tw, REFUND_STATUS } from "common-ui";
import { trpc } from "@/src/trpc-client";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import dayjs from "dayjs";

export default function OrderDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const {
    data: orderData,
    isLoading,
    error,
  } = trpc.user.order.getOrderById.useQuery(
  // } = trpc.user.order.getOrderById.useQuery(
    { orderId: id },
    { enabled: !!id }
  );
  
  
  if (isLoading) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center`}>
          <MyText style={tw`text-gray-600`}>Loading order details...</MyText>
        </View>
      </AppContainer>
    );
  }

  if (error || !orderData) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center p-4`}>
          <MaterialIcons name="error" size={64} color="#EF4444" />
          <MyText style={tw`text-red-500 text-lg font-semibold mt-4`}>
            Error
          </MyText>
          <MyText style={tw`text-gray-600 text-center mt-2`}>
            {error?.message || "Failed to load order details"}
          </MyText>
          <TouchableOpacity
            onPress={() => router.back()}
            style={tw`mt-4 bg-blue-500 px-4 py-2 rounded-lg`}
          >
            <MyText style={tw`text-white font-medium`}>Go Back</MyText>
          </TouchableOpacity>
        </View>
      </AppContainer>
    );
  }

  const order = orderData;

  if (!order) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center p-4`}>
          <MaterialIcons name="search-off" size={64} color="#9CA3AF" />
          <MyText style={tw`text-gray-500 text-lg font-semibold mt-4`}>
            Order Not Found
          </MyText>
          <MyText style={tw`text-gray-600 text-center mt-2`}>
            The order you're looking for doesn't exist or has been removed.
          </MyText>
          <TouchableOpacity
            onPress={() => router.back()}
            style={tw`mt-4 bg-blue-500 px-4 py-2 rounded-lg`}
          >
            <MyText style={tw`text-white font-medium`}>Go Back</MyText>
          </TouchableOpacity>
        </View>
      </AppContainer>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
      case "success":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          icon: "check-circle",
          color: "#16A34A",
          label: "Delivered",
        };
      case "cancelled":
        return {
          bg: "bg-red-100",
          text: "text-red-800",
          icon: "cancel",
          color: "#DC2626",
          label: "Cancelled",
        };
      case "pending":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          icon: "schedule",
          color: "#D97706",
          label: "Pending",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          icon: "info",
          color: "#6B7280",
          label: "Processing",
        };
    }
  };

  const getRefundStatusColor = (status: string) => {
    switch (status) {
      case REFUND_STATUS.SUCCESS:
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          icon: "check-circle",
          color: "#16A34A",
        };
      case REFUND_STATUS.PROCESSING:
        return {
          bg: "bg-blue-100",
          text: "text-blue-800",
          icon: "hourglass-empty",
          color: "#2563EB",
        };
      case REFUND_STATUS.PENDING:
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          icon: "schedule",
          color: "#D97706",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          icon: "info",
          color: "#6B7280",
        };
    }
  };

  const statusConfig = getStatusColor(order.orderStatus);
  const subtotal = order.items.reduce((sum, item) => sum + item.amount, 0);
  const discountAmount = order.discountAmount || 0;
  const totalAmount = order.orderAmount;

  return (
    <AppContainer>
      <ScrollView
        style={tw`flex-1 bg-gray-50`}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={tw`bg-white p-4 mb-4`}>
          <View style={tw`flex-row justify-between items-center mb-2`}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={tw`p-2 rounded-full bg-gray-100`}
            >
              <MaterialIcons name="arrow-back" size={20} color="#6B7280" />
            </TouchableOpacity>
            <View style={tw`${statusConfig.bg} px-3 py-1 rounded-full`}>
              <MyText style={tw`text-sm font-medium ${statusConfig.text}`}>
                {statusConfig.label}
              </MyText>
            </View>
          </View>
          <MyText style={tw`text-xl font-bold text-gray-800`}>
            Order #{order.orderId}
          </MyText>
          <MyText style={tw`text-gray-600 mt-1`}>
            {dayjs(order.orderDate).format("DD MMM YYYY, h:mm A")}
          </MyText>
        </View>

        {/* Delivery Information */}
        <View style={tw`bg-white p-4 mb-4`}>
          <MyText style={tw`text-lg font-semibold text-gray-800 mb-3`}>
            Delivery Information
          </MyText>
          <View style={tw`flex-row items-center mb-2`}>
            <MaterialIcons name="local-shipping" size={20} color="#6B7280" />
            <MyText style={tw`text-gray-700 ml-2 font-medium`}>Status:</MyText>
            <MyText style={tw`text-gray-600 ml-2 capitalize`}>
              {order.deliveryStatus}
            </MyText>
          </View>
          {order.deliveryDate && (
            <View style={tw`flex-row items-center`}>
              <MaterialIcons name="schedule" size={20} color="#6B7280" />
              <MyText style={tw`text-gray-700 ml-2 font-medium`}>
                Delivery Time:
              </MyText>
              <MyText style={tw`text-gray-600 ml-2`}>
                {dayjs(order.deliveryDate).format("DD MMM YYYY, h:mm A")}
              </MyText>
            </View>
          )}
        </View>

        {/* Payment Information */}
        <View style={tw`bg-white p-4 mb-4`}>
          <MyText style={tw`text-lg font-semibold text-gray-800 mb-3`}>
            Payment Information
          </MyText>
          <View style={tw`flex-row justify-between items-center mb-2`}>
            <MyText style={tw`text-gray-700 font-medium`}>
              Payment Method:
            </MyText>
            <MyText style={tw`text-gray-600 capitalize`}>
              {order.paymentMode}
            </MyText>
          </View>
          {order.paymentMode === "Online" && (
            <View style={tw`flex-row justify-between items-center`}>
              <MyText style={tw`text-gray-700 font-medium`}>
                Payment Status:
              </MyText>
              <View style={tw`flex-row items-center`}>
                <View
                  style={tw`w-2 h-2 rounded-full mr-2 ${
                    order.paymentStatus === "success"
                      ? "bg-green-500"
                      : order.paymentStatus === "pending"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                />
                <MyText style={tw`text-gray-600 capitalize`}>
                  {order.paymentStatus}
                </MyText>
              </View>
            </View>
          )}
        </View>

        {/* User Notes */}
        {order.userNotes && (
          <View style={tw`bg-white p-4 mb-4`}>
            <MyText style={tw`text-lg font-semibold text-gray-800 mb-3`}>
              Special Instructions
            </MyText>
            <View style={tw`bg-blue-50 p-3 rounded-lg`}>
              <MyText style={tw`text-blue-700`}>{order.userNotes}</MyText>
            </View>
          </View>
        )}

        {/* Cancellation Details */}
        {order.cancelReason && (
          <View style={tw`bg-white p-4 mb-4`}>
            <MyText style={tw`text-lg font-semibold text-gray-800 mb-3`}>
              Cancellation Details
            </MyText>
            <View style={tw`bg-red-50 p-3 rounded-lg mb-3`}>
              <MyText style={tw`text-red-700 font-medium mb-1`}>Reason:</MyText>
              <MyText style={tw`text-red-600`}>{order.cancelReason}</MyText>
            </View>
            {(order.refundStatus && order.refundStatus !== "none") && (
              <View style={tw`flex-row items-center mb-2`}>
                <MyText style={tw`text-gray-700 font-medium mr-2`}>
                  Refund Status:
                </MyText>
                <View
                  style={tw`flex-row items-center ${
                    getRefundStatusColor(order.refundStatus).bg
                  } px-2 py-1 rounded-full`}
                >
                  <MaterialIcons
                    name={
                      getRefundStatusColor(order.refundStatus).icon as any
                    }
                    size={12}
                    color={getRefundStatusColor(order.refundStatus).color}
                  />
                  <MyText
                    style={tw`text-xs font-semibold ${
                      getRefundStatusColor(order.refundStatus).text
                    } ml-1 capitalize`}
                  >
                    {order.refundStatus === REFUND_STATUS.PENDING
                      ? "Pending"
                      : order.refundStatus === REFUND_STATUS.PROCESSING
                      ? "Processing"
                      : order.refundStatus === REFUND_STATUS.SUCCESS
                      ? "Completed"
                      : "N/A"}
                  </MyText>
                </View>
              </View>
            )}

            {order.refundAmount && (
              <View style={tw`flex-row items-center`}>
                <MyText style={tw`text-gray-700 font-medium mr-2`}>
                  Refund Amount:
                </MyText>
                <MyText style={tw`text-green-600 font-semibold`}>
                  ₹{order.refundAmount}
                </MyText>
              </View>
            )}
          </View>
        )}

        {/* Order Items */}
        <View style={tw`bg-white p-4 mb-4`}>
          <MyText style={tw`text-lg font-semibold text-gray-800 mb-3`}>
            Order Items
          </MyText>
          {order.items.map((item: any, index: number) => (
            <View
              key={index}
              style={tw`flex-row items-center py-3 border-b border-gray-100 ${
                index === order.items.length - 1 ? "border-b-0" : ""
              }`}
            >
              <Image
                source={{ uri: item.image || undefined }}
                style={tw`w-16 h-16 rounded-lg mr-4 bg-gray-100`}
                defaultSource={require("@/assets/logo.png")}
              />
              <View style={tw`flex-1`}>
                <MyText style={tw`text-gray-800 font-medium text-base`}>
                  {item.productName}
                </MyText>
                <MyText style={tw`text-gray-600 text-sm mt-1`}>
                  {item.quantity} × ₹{item.price}
                </MyText>
              </View>
              <MyText style={tw`text-gray-800 font-semibold text-lg`}>
                ₹{item.amount}
              </MyText>
            </View>
          ))}
        </View>

        {/* Coupon Applied Section */}
        {order.couponCode && (
          <View style={tw`bg-emerald-50 p-4 mb-4 rounded-xl border border-emerald-200`}>
            <View style={tw`flex-row items-center mb-2`}>
              <MaterialIcons name="local-offer" size={20} color="#10B981" />
              <MyText style={tw`text-emerald-800 font-bold ml-2`}>
                {order.couponCode}
              </MyText>
            </View>
            <MyText style={tw`text-emerald-700 text-sm`}>
              {order.couponDescription}
            </MyText>
            <View style={tw`flex-row justify-between items-center mt-3`}>
              <MyText style={tw`text-emerald-600 font-medium`}>
                Discount Applied:
              </MyText>
              <MyText style={tw`text-emerald-800 font-bold text-lg`}>
                -₹{order.discountAmount}
              </MyText>
            </View>
          </View>
        )}

        {/* Order Summary */}
        <View style={tw`bg-white p-4 mb-4`}>
          <MyText style={tw`text-lg font-semibold text-gray-800 mb-3`}>
            Order Summary
          </MyText>
          <View style={tw`flex-row justify-between items-center mb-2`}>
            <MyText style={tw`text-gray-700`}>
              Subtotal ({order.items.length} items)
            </MyText>
            <MyText style={tw`text-gray-800 font-medium`}>
              ₹{subtotal}
            </MyText>
          </View>
          {discountAmount > 0 && (
            <View style={tw`flex-row justify-between items-center mb-2`}>
              <MyText style={tw`text-emerald-600 font-medium`}>
                Discount
              </MyText>
              <MyText style={tw`text-emerald-600 font-medium`}>
                -₹{discountAmount}
              </MyText>
            </View>
          )}
          <View
            style={tw`flex-row justify-between items-center pt-2 border-t border-gray-200`}
          >
            <MyText style={tw`text-lg font-bold text-gray-800`}>
              Total Amount
            </MyText>
            <MyText style={tw`text-xl font-bold text-gray-800`}>
              ₹{totalAmount}
            </MyText>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={tw`flex-row justify-between px-4 mb-8`}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={tw`bg-gray-500 px-6 py-3 rounded-lg flex-1 mr-2 items-center`}
          >
            <MyText style={tw`text-white font-semibold`}>Back to Orders</MyText>
          </TouchableOpacity>
          {order.orderStatus !== "cancelled" && (
            <TouchableOpacity
              onPress={() =>
                Alert.alert("Support", "Contact support for order assistance")
              }
              style={tw`bg-blue-500 px-6 py-3 rounded-lg flex-1 ml-2 items-center`}
            >
              <MyText style={tw`text-white font-semibold`}>Get Help</MyText>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </AppContainer>
  );
}
