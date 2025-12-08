import React, { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AppContainer, MyText, tw, BottomDialog, MyTextInput } from "common-ui";
import { trpc } from "@/src/trpc-client";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import dayjs from "dayjs";

export default function OrderDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [generateCouponDialogOpen, setGenerateCouponDialogOpen] =
    useState(false);
  const [initiateRefundDialogOpen, setInitiateRefundDialogOpen] =
    useState(false);
  const [refundType, setRefundType] = useState<"percent" | "amount">("percent");
  const [refundValue, setRefundValue] = useState("100");

  const {
    data: orderData,
    isLoading,
    error,
  } = trpc.admin.order.getOrderDetails.useQuery(
    { orderId: id ? parseInt(id) : 0 },
    { enabled: !!id }
  );

  const generateCouponMutation =
    trpc.admin.coupon.generateCancellationCoupon.useMutation({
      onSuccess: (coupon) => {
        Alert.alert(
          "Success",
          `Refund coupon generated successfully!\n\nCode: ${coupon.couponCode
          }\nValue: ₹${coupon.flatDiscount}\nExpires: ${coupon.validTill
            ? new Date(coupon.validTill).toLocaleDateString()
            : "N/A"
          }`
        );
        setGenerateCouponDialogOpen(false);
      },
      onError: (error: any) => {
        Alert.alert(
          "Error",
          error.message || "Failed to generate refund coupon"
        );
      },
    });

  const initiateRefundMutation = trpc.admin.payments.initiateRefund.useMutation(
    {
      onSuccess: (result) => {
        Alert.alert(
          "Success",
          `Refund initiated successfully!\n\nAmount: ₹${result.amount}\nStatus: ${result.status}`
        );
        setInitiateRefundDialogOpen(false);
      },
      onError: (error: any) => {
        Alert.alert("Error", error.message || "Failed to initiate refund");
      },
    }
  );

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
        <MyText style={tw`text-gray-500 font-medium`}>
          Loading order details...
        </MyText>
      </View>
    );
  }

  if (error || !orderData) {
    return (
      <View style={tw`flex-1 justify-center items-center p-6 bg-gray-50`}>
        <View
          style={tw`bg-white p-6 rounded-2xl shadow-sm items-center w-full`}
        >
          <MaterialIcons name="error-outline" size={48} color="#EF4444" />
          <MyText style={tw`text-gray-900 text-xl font-bold mt-4 mb-2`}>
            Oops!
          </MyText>
          <MyText style={tw`text-gray-500 text-center mb-6`}>
            {error?.message || "Failed to load order details"}
          </MyText>
          <TouchableOpacity
            onPress={() => router.back()}
            style={tw`bg-gray-900 px-6 py-3 rounded-xl w-full items-center`}
          >
            <MyText style={tw`text-white font-bold`}>Go Back</MyText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const order = orderData;

  // Calculate subtotal and discount for order summary
  const subtotal = order.items.reduce((sum, item) => sum + item.amount, 0);
  const discountAmount = order.discountAmount || 0;

  const handleGenerateCoupon = () => {
    generateCouponMutation.mutate({ orderId: order.id });
  };

  const handleInitiateRefund = () => {
    const value = parseFloat(refundValue);
    if (isNaN(value) || value <= 0) {
      Alert.alert("Error", "Please enter a valid refund value");
      return;
    }

    const mutationData: any = {
      orderId: order.id,
    };

    if (refundType === "percent") {
      if (value > 100) {
        Alert.alert("Error", "Refund percentage cannot exceed 100%");
        return;
      }
      mutationData.refundPercent = value;
    } else {
      mutationData.refundAmount = value;
    }

    initiateRefundMutation.mutate(mutationData);
    setInitiateRefundDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "text-green-600 bg-green-50 border-green-100";
      case "cancelled":
        return "text-red-600 bg-red-50 border-red-100";
      default:
        return "text-yellow-600 bg-yellow-50 border-yellow-100";
    }
  };

  const statusStyle = getStatusColor(order.status);
  const showRefundOptions = true;

  const getRefundDotColor = (status: string) => {
    if (status === 'success') return 'bg-green-500';
    else if (status === 'pending') return 'bg-yellow-500';
    else if (status === 'failed') return 'bg-red-500';
    else return 'bg-gray-500';
  };

  const getRefundTextColor = (status: string) => {
    if (status === 'success' || status === 'na') return 'text-green-700';
    else if (status === 'pending') return 'text-yellow-700';
    else if (status === 'failed') return 'text-red-700';
    else return 'text-gray-700';
  };

  const getRefundStatusText = (status: string) => {
    if (status === 'success' || status === 'na') return 'Completed';
    else if (status === 'pending') return 'Pending';
    else if (status === 'failed') return 'Failed';
    else if (status === 'none') return 'Not Initiated';
    else if (status === 'na') return 'Not Applicable';
    else return 'Unknown';
  };

  {console.log({order})}
  return (
    <AppContainer>

      <View
        style={tw`flex-1`}
      >
        {/* Order ID & Status Card */}
        <View
          style={tw`bg-white p-5 rounded-2xl shadow-sm mb-4 border border-gray-100`}
        >
          <View style={tw`flex-row justify-between items-start mb-4`}>
            <View>
              <MyText style={tw`text-sm text-gray-500 mb-1`}>Order ID</MyText>
              <MyText style={tw`text-2xl font-bold text-gray-900`}>
                #{order.readableId}
              </MyText>
            </View>
            <View style={tw`px-3 py-1.5 rounded-full border ${statusStyle}`}>
              <MyText
                style={tw`text-xs font-bold uppercase tracking-wider ${statusStyle.split(" ")[0]
                  }`}
              >
                {order.status}
              </MyText>
            </View>
          </View>

          <View style={tw`flex-row items-center bg-gray-50 p-3 rounded-xl`}>
            <MaterialIcons name="access-time" size={20} color="#6B7280" />
            <MyText style={tw`ml-2 text-gray-600 font-medium`}>
              Placed on {dayjs(order.createdAt).format("MMM DD, YYYY • h:mm A")}
            </MyText>
          </View>
        </View>

        {/* Order Progress (Simplified Timeline) */}
        {order.status !== "cancelled" && (
          <View
            style={tw`bg-white p-5 rounded-2xl shadow-sm mb-4 border border-gray-100`}
          >
            <MyText style={tw`text-base font-bold text-gray-900 mb-4`}>
              Order Status
            </MyText>
            <View style={tw`flex-row justify-between items-center px-2`}>
              {/* Placed */}
              <View style={tw`items-center`}>
                <View
                  style={tw`w-8 h-8 rounded-full bg-green-100 items-center justify-center mb-2`}
                >
                  <MaterialIcons name="check" size={16} color="#10B981" />
                </View>
                <MyText style={tw`text-xs font-medium text-gray-900`}>
                  Placed
                </MyText>
              </View>
              <View style={tw`h-0.5 flex-1 bg-green-200 mx-2 -mt-6`} />

              {/* Packaged */}
              <View style={tw`items-center`}>
                <View
                  style={tw`w-8 h-8 rounded-full ${order.isPackaged ? "bg-green-100" : "bg-gray-100"
                    } items-center justify-center mb-2`}
                >
                  <MaterialIcons
                    name="inventory-2"
                    size={16}
                    color={order.isPackaged ? "#10B981" : "#9CA3AF"}
                  />
                </View>
                <MyText
                  style={tw`text-xs font-medium ${order.isPackaged ? "text-gray-900" : "text-gray-400"
                    }`}
                >
                  Packaged
                </MyText>
              </View>
              <View
                style={tw`h-0.5 flex-1 ${order.isPackaged ? "bg-green-200" : "bg-gray-100"
                  } mx-2 -mt-6`}
              />

              {/* Delivered */}
              <View style={tw`items-center`}>
                <View
                  style={tw`w-8 h-8 rounded-full ${order.isDelivered ? "bg-green-100" : "bg-gray-100"
                    } items-center justify-center mb-2`}
                >
                  <MaterialIcons
                    name="local-shipping"
                    size={16}
                    color={order.isDelivered ? "#10B981" : "#9CA3AF"}
                  />
                </View>
                <MyText
                  style={tw`text-xs font-medium ${order.isDelivered ? "text-gray-900" : "text-gray-400"
                    }`}
                >
                  Delivered
                </MyText>
              </View>
            </View>
          </View>
        )}

        {/* Customer Details */}
        <View
          style={tw`bg-white p-5 rounded-2xl shadow-sm mb-4 border border-gray-100`}
        >
          <MyText style={tw`text-base font-bold text-gray-900 mb-4`}>
            Customer Details
          </MyText>

          <View style={tw`flex-row items-center mb-4`}>
            <View
              style={tw`w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-3`}
            >
              <MaterialIcons name="person" size={20} color="#3B82F6" />
            </View>
            <View>
              <MyText style={tw`text-sm font-bold text-gray-900`}>
                {order.customerName}
              </MyText>
              <MyText style={tw`text-xs text-gray-500`}>Customer</MyText>
            </View>
          </View>

          <View style={tw`space-y-3`}>
            <View style={tw`flex-row items-start`}>
              <View style={tw`w-6 mt-0.5`}>
                <MaterialIcons name="phone" size={16} color="#6B7280" />
              </View>
              <MyText style={tw`text-sm text-gray-600 flex-1`}>
                {order.customerMobile}
              </MyText>
            </View>
            {order.customerEmail && (
              <View style={tw`flex-row items-start mt-2`}>
                <View style={tw`w-6 mt-0.5`}>
                  <MaterialIcons name="email" size={16} color="#6B7280" />
                </View>
                <MyText style={tw`text-sm text-gray-600 flex-1`}>
                  {order.customerEmail}
                </MyText>
              </View>
            )}
            <View
              style={tw`flex-row items-start mt-2 pt-3 border-t border-gray-50`}
            >
              <View style={tw`w-6 mt-0.5`}>
                <MaterialIcons name="location-on" size={16} color="#6B7280" />
              </View>
              <View style={tw`flex-1`}>
                <MyText style={tw`text-sm text-gray-600 leading-5`}>
                  {order.address.line1}
                  {order.address.line2 ? `, ${order.address.line2}` : ""}
                  {`\n${order.address.city}, ${order.address.state} - ${order.address.pincode}`}
                </MyText>
              </View>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View
          style={tw`bg-white p-5 rounded-2xl shadow-sm mb-4 border border-gray-100`}
        >
          <MyText style={tw`text-base font-bold text-gray-900 mb-4`}>
            Items Ordered
          </MyText>
          {order.items.map((item, index) => (
            <View
              key={index}
              style={tw`flex-row items-center py-3 border-b border-gray-50 ${index === order.items.length - 1 ? "border-b-0" : ""
                }`}
            >
              <View
                style={tw`w-10 h-10 bg-gray-100 rounded-lg items-center justify-center mr-3`}
              >
                <FontAwesome5 name="box" size={14} color="#6B7280" />
              </View>
              <View style={tw`flex-1`}>
                <MyText style={tw`text-sm font-bold text-gray-900`}>
                  {item.name}
                </MyText>
                <MyText style={tw`text-xs text-gray-500`}>
                  {item.quantity} {item.unit} × ₹{item.price}
                </MyText>
              </View>
              <MyText style={tw`text-sm font-bold text-gray-900`}>
                ₹{item.amount}
              </MyText>
            </View>
          ))}

          <View style={tw`mt-4 pt-4 border-t border-gray-100`}>
            <View style={tw`flex-row justify-between items-center mb-2`}>
              <MyText style={tw`text-base font-bold text-gray-900`}>
                Subtotal ({order.items.length} items)
              </MyText>
              <MyText style={tw`text-base font-bold text-gray-900`}>
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
            <View style={tw`flex-row justify-between items-center pt-2 border-t border-gray-200`}>
              <MyText style={tw`text-lg font-bold text-gray-900`}>
                Total Amount
              </MyText>
              <MyText style={tw`text-xl font-bold text-blue-600`}>
                ₹{order.totalAmount}
              </MyText>
            </View>
          </View>
        </View>

        {/* Admin Notes */}
        {order.adminNotes && (
          <View
            style={tw`bg-yellow-50 p-5 rounded-2xl border border-yellow-100 mb-4`}
          >
            <View style={tw`flex-row items-center mb-2`}>
              <MaterialIcons name="note" size={18} color="#D97706" />
              <MyText style={tw`text-sm font-bold text-yellow-800 ml-2`}>
                Admin Notes
              </MyText>
            </View>
            <MyText style={tw`text-sm text-yellow-900 leading-5`}>
              {order.adminNotes}
            </MyText>
          </View>
        )}

        {/* Coupon Applied Section */}
        {order.couponCode && (
          <View
            style={tw`bg-emerald-50 p-5 rounded-2xl shadow-sm mb-4 border border-emerald-100`}
          >
            <MyText style={tw`text-lg font-bold text-emerald-800 mb-3`}>
              Coupon Applied
            </MyText>
            <View style={tw`bg-emerald-100 p-4 rounded-xl border border-emerald-200`}>
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
          </View>
        )}

        {/* Refund Coupon Section */}
        {order.orderStatus?.refundCouponId && (
          <View style={tw`bg-blue-50 p-5 rounded-2xl shadow-sm mb-4 border border-blue-100`}>
            <MyText style={tw`text-lg font-bold text-blue-800 mb-3`}>
              Refund Coupon
            </MyText>
            <View style={tw`bg-blue-100 p-4 rounded-xl border border-blue-200`}>
              <View style={tw`flex-row items-center mb-2`}>
                <MaterialIcons name="local-offer" size={20} color="#2563EB" />
                <MyText style={tw`text-blue-800 font-bold ml-2`}>
                  {order.couponCode}
                </MyText>
              </View>
              <MyText style={tw`text-blue-700 text-sm`}>
                Generated refund coupon for order cancellation
              </MyText>
              <View style={tw`flex-row justify-between items-center mt-3`}>
                <MyText style={tw`text-blue-600 font-medium`}>
                  Value:
                </MyText>
                <MyText style={tw`text-blue-800 font-bold text-lg`}>
                  ₹{order.couponData?.discountAmount}
                </MyText>
              </View>
              {/* <View style={tw`flex-row justify-between items-center mt-2`}>
                <MyText style={tw`text-blue-600 font-medium`}>
                  Expires:
                </MyText>
                <MyText style={tw`text-blue-800 font-medium`}>
                  {order.couponData?.
                    ? dayjs(order.orderStatus.refundCoupon.validTill).format("DD MMM YYYY")
                    : "N/A"}
                </MyText>
              </View> */}
            </View>
          </View>
        )}

        {/* Refund Details */}
        {/* {(order.orderStatus?.paymentStatus === "success" ||
          (order.isCod && order.isDelivered)) && ( */}
          <View
            style={tw`bg-red-50 p-5 rounded-2xl border border-red-100 mb-4`}
          >
            <MyText style={tw`text-sm font-bold text-red-800 mb-3`}>
              {order.status === "cancelled" ? "Cancellation Details" : "Refund Details"}
            </MyText>
            {order.status === "cancelled" && order.cancelReason && (
              <View style={tw`mb-3`}>
                <MyText
                  style={tw`text-xs text-red-600 uppercase font-bold mb-1`}
                >
                  Cancellation Reason
                </MyText>
                <MyText style={tw`text-sm text-red-900`}>
                  {order.cancelReason}
                </MyText>
            </View>
          )}
             <View
               style={tw`flex-row justify-between items-center bg-white/50 p-3 rounded-xl mb-4`}
             >
               <MyText style={tw`text-sm font-medium text-red-800`}>
                 Refund Status
               </MyText>
               <View style={tw`flex-row items-center`}>
                 <View
                   style={tw`w-2 h-2 rounded-full mr-2 ${getRefundDotColor(order.refundStatus)}`}
                 />
                  <MyText
                    style={tw`text-sm font-bold ${getRefundTextColor(order.refundStatus)}`}
                  >
                    {getRefundStatusText(order.refundStatus)}
                  </MyText>
               </View>
             </View>
             {order.refundRecord && (
               <View
                 style={tw`flex-row justify-between items-center bg-white/50 p-3 rounded-xl mb-4`}
               >
                 <MyText style={tw`text-sm font-medium text-red-800`}>
                   Refund Amount
                 </MyText>
                 <MyText style={tw`text-sm font-bold text-red-900`}>
                   ₹{order.refundRecord.refundAmount}
                 </MyText>
               </View>
             )}

              {/* {((order.refundStatus !== 'success' || !order.refundStatus) && order.isDelivered ) && ( */}

              {(!Boolean(order.refundRecord)) && <View style={tw`flex-row gap-3 mt-2`}>
                {!order.isCod && (<TouchableOpacity
                  style={tw`flex-1 bg-red-500 py-3 px-4 rounded-xl items-center flex-row justify-center shadow-sm`}
                  onPress={() => setInitiateRefundDialogOpen(true)}
                >
                  <MaterialIcons name="payments" size={18} color="white" style={tw`mr-2`} />
                  <MyText style={tw`text-white font-bold text-sm`}>
                    Initiate Refund
                  </MyText>
                </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={tw`flex-1 bg-emerald-500 py-3 px-4 rounded-xl items-center flex-row justify-center shadow-sm`}
                  onPress={() => setGenerateCouponDialogOpen(true)}
                >
                  <MaterialIcons name="local-offer" size={18} color="white" style={tw`mr-2`} />
                  <MyText style={tw`text-white font-bold text-sm`}>
                    Generate Refund Coupon
                  </MyText>
                </TouchableOpacity>
              </View>}

          </View>
        {/* )} */}
      </View>
        <View style={tw`h-32`}></View>

      {/* Bottom Action Bar */}
      <View
        style={tw`absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-${Platform.OS === "ios" ? "8" : "4"
          }`}
      >
        <TouchableOpacity
          onPress={() => router.push("/(drawer)/manage-orders")}
          style={tw`bg-gray-900 rounded-xl py-4 items-center shadow-lg`}
        >
          <MyText style={tw`text-white font-bold text-base`}>
            Manage Orders
          </MyText>
        </TouchableOpacity>
      </View>

      {/* Generate Coupon Dialog */}
      <BottomDialog
        open={generateCouponDialogOpen}
        onClose={() => setGenerateCouponDialogOpen(false)}
      >
        <View style={tw`p-6`}>
          <View style={tw`items-center mb-6`}>
            <View style={tw`w-12 h-12 bg-emerald-100 rounded-full items-center justify-center mb-3`}>
              <MaterialIcons name="local-offer" size={24} color="#10B981" />
            </View>
            <MyText style={tw`text-xl font-bold text-gray-900 text-center`}>
              Generate Refund Coupon
            </MyText>
            <MyText style={tw`text-gray-500 text-center mt-2 text-sm leading-5`}>
              Create a one-time use coupon for the customer equal to the order amount. Valid for 30 days.
            </MyText>
          </View>

          <View style={tw`bg-amber-50 p-4 rounded-xl border border-amber-100 mb-6 flex-row items-start`}>
            <MaterialIcons name="info-outline" size={20} color="#D97706" style={tw`mt-0.5`} />
            <MyText style={tw`text-sm text-amber-800 ml-2 flex-1 leading-5`}>
              This only works for online payment orders. COD orders cannot generate refund coupons.
            </MyText>
          </View>

          <View style={tw`flex-row gap-3`}>
            <TouchableOpacity
              style={tw`flex-1 bg-gray-100 py-3.5 rounded-xl items-center`}
              onPress={() => setGenerateCouponDialogOpen(false)}
            >
              <MyText style={tw`text-gray-700 font-bold`}>Cancel</MyText>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`flex-1 bg-emerald-500 py-3.5 rounded-xl items-center shadow-sm`}
              onPress={handleGenerateCoupon}
              disabled={generateCouponMutation.isPending}
            >
              <MyText style={tw`text-white font-bold`}>
                {generateCouponMutation.isPending
                  ? "Generating..."
                  : "Generate Coupon"}
              </MyText>
            </TouchableOpacity>
          </View>
        </View>
      </BottomDialog>

      {/* Initiate Refund Dialog */}
      <BottomDialog
        open={initiateRefundDialogOpen}
        onClose={() => setInitiateRefundDialogOpen(false)}
      >
        <View style={tw`p-6`}>
          <View style={tw`items-center mb-6`}>
            <View style={tw`w-12 h-12 bg-red-100 rounded-full items-center justify-center mb-3`}>
              <MaterialIcons name="payments" size={24} color="#EF4444" />
            </View>
            <MyText style={tw`text-xl font-bold text-gray-900 text-center`}>
              Initiate Refund
            </MyText>
            <MyText style={tw`text-gray-500 text-center mt-2 text-sm`}>
              Process a refund directly to the customer's source account via Razorpay.
            </MyText>
          </View>

          {/* Refund Type Selection */}
          <View style={tw`mb-6`}>
            <MyText style={tw`text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide`}>
              Refund Type
            </MyText>
            <View style={tw`flex-row gap-3`}>
              <TouchableOpacity
                style={tw`flex-1 p-4 rounded-xl border-2 ${refundType === "percent"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-100 bg-gray-50"
                  } items-center`}
                onPress={() => setRefundType("percent")}
              >
                <MaterialIcons
                  name="percent"
                  size={24}
                  color={refundType === "percent" ? "#3B82F6" : "#9CA3AF"}
                  style={tw`mb-2`}
                />
                <MyText
                  style={tw`text-sm font-bold ${refundType === "percent" ? "text-blue-700" : "text-gray-500"
                    }`}
                >
                  Percentage
                </MyText>
              </TouchableOpacity>

              <TouchableOpacity
                style={tw`flex-1 p-4 rounded-xl border-2 ${refundType === "amount"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-100 bg-gray-50"
                  } items-center`}
                onPress={() => setRefundType("amount")}
              >
                <MaterialIcons
                  name="attach-money"
                  size={24}
                  color={refundType === "amount" ? "#3B82F6" : "#9CA3AF"}
                  style={tw`mb-2`}
                />
                <MyText
                  style={tw`text-sm font-bold ${refundType === "amount" ? "text-blue-700" : "text-gray-500"
                    }`}
                >
                  Fixed Amount
                </MyText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Refund Value Input */}
          <View style={tw`mb-6`}>
            <MyTextInput
              topLabel={`Refund ${refundType === "percent" ? "Percentage (%)" : "Amount (₹)"
                }`}
              value={refundValue}
              onChangeText={setRefundValue}
              keyboardType="numeric"
              placeholder={refundType === "percent" ? "100" : "0.00"}
              style={tw`bg-white`}
            />
          </View>

           <View style={tw`bg-amber-50 p-4 rounded-xl border border-amber-100 mb-6 flex-row items-start`}>
             <MaterialIcons name="info-outline" size={20} color="#D97706" style={tw`mt-0.5`} />
             <MyText style={tw`text-sm text-amber-800 ml-2 flex-1 leading-5`}>
               For COD orders, refunds are processed immediately upon delivery confirmation.
             </MyText>
           </View>

          <View style={tw`flex-row gap-3`}>
            <TouchableOpacity
              style={tw`flex-1 bg-gray-100 py-3.5 rounded-xl items-center`}
              onPress={() => setInitiateRefundDialogOpen(false)}
            >
              <MyText style={tw`text-gray-700 font-bold`}>Cancel</MyText>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`flex-1 bg-red-500 py-3.5 rounded-xl items-center shadow-sm`}
              onPress={handleInitiateRefund}
              disabled={initiateRefundMutation.isPending}
            >
              <MyText style={tw`text-white font-bold`}>
                {initiateRefundMutation.isPending
                  ? "Processing..."
                  : "Confirm Refund"}
              </MyText>
            </TouchableOpacity>
          </View>
        </View>
      </BottomDialog>
    </AppContainer>
  );
}

