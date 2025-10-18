import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { tw } from 'common-ui';
import { CustomDropdown, Checkbox } from 'common-ui';
import { Quantifier } from 'common-ui';

const cartItems = [
  {
    id: 1,
    productName: 'Fresh Organic Apples',
    quantity: 2,
    price: 120,
    unit: 'kg',
    quantityIncrementStep: 0.25,
    image: 'https://picsum.photos/100/100?random=1',
    availability: [
      { date: '2025-10-20', timeSlot: '7am', available: true },
      { date: '2025-10-20', timeSlot: '6pm', available: false },
      { date: '2025-10-21', timeSlot: '7am', available: true },
      { date: '2025-10-21', timeSlot: '6pm', available: true },
      { date: '2025-10-22', timeSlot: '7am', available: false },
      { date: '2025-10-22', timeSlot: '6pm', available: true },
    ],
  },
  {
    id: 2,
    productName: 'Organic Bananas',
    quantity: 1,
    price: 80,
    unit: 'kg',
    quantityIncrementStep: 1,
    image: 'https://picsum.photos/100/100?random=2',
    availability: [
      { date: '2025-10-20', timeSlot: '7am', available: false },
      { date: '2025-10-20', timeSlot: '6pm', available: true },
      { date: '2025-10-21', timeSlot: '7am', available: true },
      { date: '2025-10-21', timeSlot: '6pm', available: false },
      { date: '2025-10-22', timeSlot: '7am', available: true },
      { date: '2025-10-22', timeSlot: '6pm', available: true },
    ],
  },
];

const isProductAvailable = (item: typeof cartItems[0], slotValue: string) => {
  const [date, timeSlot] = slotValue.split('#');
  return item.availability.some(s => s.date === date && s.timeSlot === timeSlot && s.available);
};

const getAvailableSlots = () => {
  const slots = new Set<string>();
  cartItems.forEach(item => {
    item.availability.filter(s => s.available).forEach(s => {
      slots.add(`${s.date}#${s.timeSlot}`);
    });
  });
  return Array.from(slots).map(value => {
    const [date, timeSlot] = value.split('#');
    return { label: `${date} ${timeSlot}`, value };
  });
};

export default function MyCart() {
  const [selectedSlot, setSelectedSlot] = useState<string | number>('');
  const [checkedProducts, setCheckedProducts] = useState<Record<number, boolean>>({});
  const [quantities, setQuantities] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    cartItems.forEach(item => {
      initial[item.id] = item.quantity;
    });
    return initial;
  });

  const totalPrice = cartItems.filter(item => checkedProducts[item.id]).reduce((sum, item) => sum + item.price * (quantities[item.id] || item.quantity), 0);
  return (
    <ScrollView style={tw`flex-1 bg-white`}>
      <View style={tw`p-4`}>
        <Text style={tw`text-2xl font-bold mb-4`}>My Cart</Text>

        <CustomDropdown
          label="Select Delivery Time"
          value={selectedSlot}
          options={getAvailableSlots()}
          onValueChange={setSelectedSlot}
          placeholder="Choose delivery time"
          style={tw`mb-4`}
        />

        {cartItems.map((item) => (
          <View key={item.id} style={tw`mb-4 p-4 bg-gray-100 rounded`}>
            <View style={tw`flex-row items-center mb-2`}>
              <Checkbox
                checked={checkedProducts[item.id] || false}
                onPress={() => setCheckedProducts(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                disabled={selectedSlot ? !isProductAvailable(item, selectedSlot as string) : false}
                style={tw`mr-4`}
              />
              <Image source={{ uri: item.image }} style={tw`w-16 h-16 rounded mr-4`} />
              <View style={tw`flex-1`}>
                <Text style={tw`text-lg font-semibold`}>{item.productName}</Text>
                <View style={tw`flex-row items-center mt-1`}>
                  <Text style={tw`text-sm mr-2`}>Quantity:</Text>
                  {checkedProducts[item.id] ? (
                    <Quantifier
                      value={quantities[item.id]}
                      setValue={(value) => setQuantities(prev => ({ ...prev, [item.id]: value }))}
                      step={item.quantityIncrementStep}
                    />
                  ) : (
                    <Text style={tw`text-sm`}>{item.quantity} {item.unit}</Text>
                  )}
                </View>
                <Text style={tw`text-base font-bold`}>₹{item.price * (quantities[item.id] || item.quantity)}</Text>
              </View>
            </View>
          </View>
        ))}

        <View style={tw`mt-4 p-4 bg-gray-200 rounded`}>
          <Text style={tw`text-xl font-bold`}>Total: ₹{totalPrice}</Text>
        </View>

        <View style={tw`flex-row justify-between mt-4`}>
          <TouchableOpacity style={tw`bg-indigo-600 p-3 rounded-md flex-1 mr-2 items-center`}>
            <Text style={tw`text-white text-base font-bold`}>Checkout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={tw`bg-gray-600 p-3 rounded-md flex-1 ml-2 items-center`}>
            <Text style={tw`text-white text-base font-bold`}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}