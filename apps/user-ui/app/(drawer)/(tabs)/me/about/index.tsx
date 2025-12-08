import React from 'react';
import { View, ScrollView, Image, TouchableOpacity, Linking } from 'react-native';
import { AppContainer, MyText, tw } from 'common-ui';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

export default function About() {
  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) => console.error("Couldn't load page", err));
  };

  return (
    <AppContainer>
      <ScrollView
        style={tw`flex-1 bg-gray-50`}
        contentContainerStyle={tw`pb-12`}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={tw`bg-white pb-8 rounded-b-3xl shadow-sm mb-6 overflow-hidden`}>
          <View style={tw`bg-green-600 h-32 absolute top-0 left-0 right-0`} />
          <View style={tw`px-6 pt-16 items-center`}>
            <View style={tw`w-24 h-24 bg-white rounded-2xl shadow-lg items-center justify-center mb-4`}>
              <FontAwesome5 name="store" size={40} color="#16A34A" />
            </View>
            <MyText style={tw`text-3xl font-bold text-gray-900 text-center mb-2`}>
              Meat Farmer
            </MyText>
            <MyText style={tw`text-base text-gray-600 text-center px-4 leading-6`}>
              Bringing local trust and online convenience together.
            </MyText>
          </View>
        </View>

        {/* Mission Cards */}
        <View style={tw`px-4 mb-6`}>
          <MyText style={tw`text-lg font-bold text-gray-900 mb-4 ml-2`}>Our Mission</MyText>
          <View style={tw`flex-row flex-wrap justify-between`}>
            <View style={tw`w-[48%] bg-white p-4 rounded-2xl shadow-sm mb-4 border border-gray-100`}>
              <View style={tw`w-10 h-10 bg-blue-50 rounded-full items-center justify-center mb-3`}>
                <MaterialIcons name="location-on" size={20} color="#3B82F6" />
              </View>
              <MyText style={tw`font-bold text-gray-900 mb-1`}>Local Roots</MyText>
              <MyText style={tw`text-xs text-gray-500 leading-4`}>Based in MBNR, supporting our community.</MyText>
            </View>
            <View style={tw`w-[48%] bg-white p-4 rounded-2xl shadow-sm mb-4 border border-gray-100`}>
              <View style={tw`w-10 h-10 bg-green-50 rounded-full items-center justify-center mb-3`}>
                <MaterialIcons name="attach-money" size={20} color="#10B981" />
              </View>
              <MyText style={tw`font-bold text-gray-900 mb-1`}>Best Price</MyText>
              <MyText style={tw`text-xs text-gray-500 leading-4`}>Minimizing costs to enhance your buying experience.</MyText>
            </View>
            <View style={tw`w-[48%] bg-white p-4 rounded-2xl shadow-sm mb-4 border border-gray-100`}>
              <View style={tw`w-10 h-10 bg-purple-50 rounded-full items-center justify-center mb-3`}>
                <MaterialIcons name="verified" size={20} color="#8B5CF6" />
              </View>
              <MyText style={tw`font-bold text-gray-900 mb-1`}>Quality First</MyText>
              <MyText style={tw`text-xs text-gray-500 leading-4`}>Committed to fresh, high-quality meat products.</MyText>
            </View>
            <View style={tw`w-[48%] bg-white p-4 rounded-2xl shadow-sm mb-4 border border-gray-100`}>
              <View style={tw`w-10 h-10 bg-orange-50 rounded-full items-center justify-center mb-3`}>
                <MaterialIcons name="emoji-people" size={20} color="#F97316" />
              </View>
              <MyText style={tw`font-bold text-gray-900 mb-1`}>Farmers First</MyText>
              <MyText style={tw`text-xs text-gray-500 leading-4`}>Dedicated to supporting local farmers.</MyText>
            </View>
          </View>
        </View>

        {/* Sourcing Section */}
        <View style={tw`px-4 mb-6`}>
          <View style={tw`bg-white p-5 rounded-2xl shadow-sm border border-gray-100`}>
            <View style={tw`flex-row items-center mb-4`}>
              <View style={tw`w-10 h-10 bg-teal-50 rounded-full items-center justify-center mr-3`}>
                <FontAwesome5 name="seedling" size={18} color="#14B8A6" />
              </View>
              <MyText style={tw`text-lg font-bold text-gray-900`}>Sourcing & Quality</MyText>
            </View>

            <View style={tw`space-y-4`}>
              <View style={tw`flex-row items-start`}>
                <MaterialIcons name="check-circle" size={20} color="#14B8A6" style={tw`mt-0.5 mr-2`} />
                <MyText style={tw`text-gray-600 flex-1 text-sm`}>
                  All items are procured directly from authorized dealers.
                </MyText>
              </View>
              <View style={tw`flex-row items-start`}>
                <MaterialIcons name="check-circle" size={20} color="#14B8A6" style={tw`mt-0.5 mr-2`} />
                <MyText style={tw`text-gray-600 flex-1 text-sm`}>
                  100% local products sourced from trusted suppliers.
                </MyText>
              </View>
              <View style={tw`flex-row items-start`}>
                <MaterialIcons name="check-circle" size={20} color="#14B8A6" style={tw`mt-0.5 mr-2`} />
                <MyText style={tw`text-gray-600 flex-1 text-sm`}>
                  All products are purely <MyText style={tw`font-bold text-teal-700`}>Halal</MyText> certified.
                </MyText>
              </View>
            </View>
          </View>
        </View>

        {/* Payments & Refunds Section */}
        <View style={tw`px-4 mb-8`}>
          <View style={tw`bg-white p-5 rounded-2xl shadow-sm border border-gray-100`}>
            <View style={tw`flex-row items-center mb-4`}>
              <View style={tw`w-10 h-10 bg-indigo-50 rounded-full items-center justify-center mr-3`}>
                <MaterialIcons name="payment" size={20} color="#6366F1" />
              </View>
              <MyText style={tw`text-lg font-bold text-gray-900`}>Payments & Refunds</MyText>
            </View>

            <View style={tw`bg-gray-50 p-4 rounded-xl mb-4`}>
              <MyText style={tw`text-sm text-gray-700 leading-5 mb-2`}>
                <MyText style={tw`font-bold`}>Payment Options:</MyText> Online or Cash on Delivery (COD).
              </MyText>
              <MyText style={tw`text-sm text-gray-700 leading-5`}>
                <MyText style={tw`font-bold`}>Complaints:</MyText> Must be raised within 12 hours of delivery.
              </MyText>
            </View>

            <View style={tw`space-y-3`}>
              <View style={tw`flex-row items-start`}>
                <View style={tw`w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 mr-2`} />
                <MyText style={tw`text-gray-600 flex-1 text-sm`}>
                  Refunds are processed to the original payment method.
                </MyText>
              </View>
              <View style={tw`flex-row items-start`}>
                <View style={tw`w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 mr-2`} />
                <MyText style={tw`text-gray-600 flex-1 text-sm`}>
                  Alternatively, receive a refund coupon for future purchases.
                </MyText>
              </View>
              <View style={tw`flex-row items-start`}>
                <View style={tw`w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 mr-2`} />
                <MyText style={tw`text-gray-600 flex-1 text-sm`}>
                  Processing time: Up to 3 business days.
                </MyText>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={tw`items-center px-6`}>
          <MyText style={tw`text-gray-400 text-sm mb-2`}>Follow us</MyText>
          <View style={tw`flex-row space-x-6 mb-6`}>
            <TouchableOpacity style={tw`p-2 bg-white rounded-full shadow-sm`}>
              <FontAwesome5 name="instagram" size={20} color="#E1306C" />
            </TouchableOpacity>
            <TouchableOpacity style={tw`p-2 bg-white rounded-full shadow-sm`}>
              <FontAwesome5 name="facebook" size={20} color="#1877F2" />
            </TouchableOpacity>
            <TouchableOpacity style={tw`p-2 bg-white rounded-full shadow-sm`}>
              <FontAwesome5 name="twitter" size={20} color="#1DA1F2" />
            </TouchableOpacity>
          </View>
          <MyText style={tw`text-gray-400 text-xs`}>
            © 2024 Meat Farmer. All rights reserved.
          </MyText>
        </View>
      </ScrollView>
    </AppContainer>
  );
}