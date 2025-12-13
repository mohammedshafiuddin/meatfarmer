import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { tw } from 'common-ui'
import { trpc } from '@/src/trpc-client'

const { height: screenHeight } = Dimensions.get('window')

const FloatingCartBar: React.FC = () => {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)
  const { data: cartData } = trpc.user.cart.getCart.useQuery()
  const { data: constsData } = trpc.common.essentialConsts.useQuery()
  const cartItems = cartData?.items || []
  const itemCount = cartItems.length

  if (itemCount === 0) return null

  const firstItem = cartItems[0]
  const expandedHeight = screenHeight * 0.7

  // Calculate total cart value and free delivery info
  const totalCartValue = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  const freeDeliveryThreshold = constsData?.freeDeliveryThreshold || 200
  const remainingForFreeDelivery = Math.max(0, freeDeliveryThreshold - totalCartValue)

  return (
    <View
      style={[
        tw`absolute bottom-0 left-4 right-4 bg-white rounded-2xl shadow-lg border border-gray-100`,
        isExpanded && { height: expandedHeight }
      ]}
    >
      {!isExpanded ? (
        // Collapsed View
        <View style={tw`flex-row items-center justify-between px-4 py-3`}>
          <TouchableOpacity
            style={tw`flex-row items-center`}
            onPress={() => setIsExpanded(true)}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: firstItem.product.images?.[0] }}
              style={tw`w-8 h-8 rounded-lg bg-gray-100 mr-3`}
            />
            <View style={tw`flex-col`}>
              <View style={tw`flex-row items-center`}>
                <Text style={tw`text-gray-900 font-semibold text-sm mr-2`}>
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </Text>
                <MaterialIcons name="keyboard-arrow-up" size={20} color="#2E90FA" />
              </View>
              {(remainingForFreeDelivery > 0 || remainingForFreeDelivery === 0) && (
                <View style={tw`mt-0.5`}>
                  {remainingForFreeDelivery > 0 ? (
                    <Text style={tw`text-green-600 text-xs font-medium`}>
                      ₹{remainingForFreeDelivery} for free delivery
                    </Text>
                  ) : (
                    <View style={tw`flex-row items-center`}>
                      <MaterialIcons name="celebration" size={14} color="#10B981" style={tw`mr-1`} />
                      <Text style={tw`text-green-600 text-xs font-medium`}>
                        Free Delivery Available
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </TouchableOpacity>

          <View style={tw`flex-1`} />

          <TouchableOpacity
            style={tw`w-10 h-10 bg-brand500 rounded-full items-center justify-center`}
            onPress={() => router.push('/(drawer)/(tabs)/cart')}
            activeOpacity={0.8}
          >
            <MaterialIcons name="shopping-cart" size={18} color="white" />
          </TouchableOpacity>
        </View>
      ) : (
        // Expanded View
        <View style={tw`flex-1`}>
          {/* Header */}
          <View style={tw`flex-row items-center justify-between px-4 py-3 border-b border-gray-100`}>
            <Text style={tw`text-gray-900 font-bold text-lg`}>Cart Items ({itemCount})</Text>
            <TouchableOpacity
              style={tw`w-8 h-8 rounded-full items-center justify-center`}
              onPress={() => setIsExpanded(false)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="keyboard-arrow-down" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Items List */}
          <ScrollView style={tw`flex-1 px-4`} showsVerticalScrollIndicator={false}>
            {cartItems.map((item, index) => (
              <View key={item.id} style={tw`flex-row items-center py-3 border-b border-gray-50`}>
                <Image
                  source={{ uri: item.product.images?.[0] }}
                  style={tw`w-12 h-12 rounded-lg bg-gray-100 mr-3`}
                />
                <View style={tw`flex-1`}>
                  <Text style={tw`text-gray-900 font-medium text-sm`} numberOfLines={2}>
                    {item.product.name}
                  </Text>
                  <Text style={tw`text-gray-500 text-xs mt-1`}>
                    ₹{item.product.price} × {item.quantity}
                  </Text>
                </View>
                <Text style={tw`text-gray-900 font-semibold text-sm`}>
                  ₹{(item.product.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Footer with Go to Cart Button */}
          <View style={tw`px-4 py-3 border-t border-gray-100`}>
            <TouchableOpacity
              style={tw`bg-brand500 py-3 rounded-xl items-center`}
              onPress={() => router.push('/(drawer)/(tabs)/cart')}
              activeOpacity={0.8}
            >
              <Text style={tw`text-white font-bold text-base`}>Go to Cart</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )
}

export default FloatingCartBar