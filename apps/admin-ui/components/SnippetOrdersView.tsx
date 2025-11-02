import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { MyText, tw, AppContainer } from 'common-ui';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface OrderProduct {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  unit: string;
  subtotal: number;
}

interface SnippetOrder {
  orderId: string;
  orderDate: string;
  customerName: string;
  totalAmount: string;
  slotInfo: {
    time: string;
    sequence: any[];
  } | null;
  products: OrderProduct[];
  matchedProducts: number[];
  snippetCode: string;
}

interface SnippetOrdersViewProps {
  orders: SnippetOrder[];
  snippetCode: string;
  onClose: () => void;
}

const OrderCard: React.FC<{ order: SnippetOrder }> = ({ order }) => {
  const orderDate = new Date(order.orderDate);
  const slotTime = order.slotInfo ? new Date(order.slotInfo.time) : null;

  return (
    <View style={tw`bg-white p-4 mb-3 rounded-2xl shadow-lg border border-gray-100`}>
      {/* Order Header */}
      <View style={tw`flex-row justify-between items-start mb-3`}>
        <View style={tw`flex-1`}>
          <MyText style={tw`font-bold text-gray-800 text-lg`}>{order.orderId}</MyText>
          <MyText style={tw`text-sm text-gray-600`}>{order.customerName}</MyText>
        </View>
        <View style={tw`items-end`}>
          <MyText style={tw`font-bold text-green-600`}>₹{order.totalAmount}</MyText>
          <MyText style={tw`text-xs text-gray-500`}>
            {orderDate.toLocaleDateString()}
          </MyText>
        </View>
      </View>

      {/* Slot Info */}
      {slotTime && (
        <View style={tw`mb-3 p-2 bg-blue-50 rounded-lg`}>
          <MyText style={tw`text-sm text-blue-800 font-medium`}>
            Delivery: {slotTime.toLocaleString()}
          </MyText>
        </View>
      )}

      {/* Products */}
      <View style={tw`mb-3`}>
        <MyText style={tw`text-sm font-semibold text-gray-700 mb-2`}>Products:</MyText>
        {order.products.map((product, index) => {
          const isMatched = order.matchedProducts.includes(product.productId);
          return (
            <View
              key={index}
              style={tw`flex-row justify-between items-center py-1 ${isMatched ? 'bg-yellow-50 px-2 rounded' : ''}`}
            >
              <View style={tw`flex-1`}>
                <MyText style={tw`text-sm ${isMatched ? 'font-semibold text-yellow-800' : 'text-gray-700'}`}>
                  {product.productName}
                  {isMatched && ' ⭐'}
                </MyText>
                <MyText style={tw`text-xs text-gray-500`}>
                  {product.quantity} {product.unit} × ₹{product.price}
                </MyText>
              </View>
              <MyText style={tw`text-sm font-medium ${isMatched ? 'text-yellow-800' : 'text-gray-700'}`}>
                ₹{product.subtotal.toFixed(2)}
              </MyText>
            </View>
          );
        })}
      </View>

      {/* Matched Products Summary */}
      <View style={tw`p-2 bg-yellow-50 rounded-lg`}>
        <MyText style={tw`text-xs text-yellow-700`}>
          Matched {order.matchedProducts.length} product(s) from snippet "{order.snippetCode}"
        </MyText>
      </View>
    </View>
  );
};

const SnippetOrdersView: React.FC<SnippetOrdersViewProps> = ({
  orders,
  snippetCode,
  onClose,
}) => {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

  return (
    <AppContainer>
      <View style={tw`flex-1 bg-gray-50`}>
        {/* Header */}
        <View style={tw`px-6 py-4 bg-white border-b border-gray-200`}>
          <View style={tw`flex-row justify-between items-center`}>
            <View style={tw`flex-1`}>
              <MyText style={tw`text-xl font-bold text-gray-800`}>Orders for "{snippetCode}"</MyText>
              <MyText style={tw`text-gray-600 mt-1`}>
                {totalOrders} order{totalOrders !== 1 ? 's' : ''} • Total: ₹{totalRevenue.toFixed(2)}
              </MyText>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={tw`p-2`}
            >
              <MyText style={tw`text-gray-500 text-lg`}>✕</MyText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Orders List */}
        <ScrollView style={tw`flex-1 px-6`} showsVerticalScrollIndicator={false}>
          {orders.length === 0 ? (
            <View style={tw`flex-1 justify-center items-center py-12`}>
              <MaterialIcons name="shopping-cart" size={64} color="#D1D5DB" />
              <MyText style={tw`text-gray-500 text-lg font-semibold mt-4`}>No matching orders</MyText>
              <MyText style={tw`text-gray-400 text-center mt-2`}>
                No orders found that match this snippet's criteria
              </MyText>
            </View>
          ) : (
            <View style={tw`py-4`}>
              {orders.map((order, index) => (
                <OrderCard key={index} order={order} />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </AppContainer>
  );
};

export default SnippetOrdersView;