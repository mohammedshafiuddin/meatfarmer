import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useFormik } from 'formik';
import { MyText, tw, DatePicker, MyTextInput } from 'common-ui';
import BottomDropdown from 'common-ui/src/components/bottom-dropdown';
import { trpc } from '../src/trpc-client';
import { useCreateVendorSnippet, useUpdateVendorSnippet } from '../src/api-hooks/vendor-snippets.api';

interface VendorSnippet {
  id: number;
  snippetCode: string;
  slotId: number;
  productIds: number[];
  validTill: string | null;
  createdAt: string;
}

interface VendorSnippetFormProps {
  snippet?: VendorSnippet | null;
  onClose: () => void;
  onSuccess: () => void;
}

const VendorSnippetForm: React.FC<VendorSnippetFormProps> = ({
  snippet,
  onClose,
  onSuccess,
}) => {

  // Fetch slots and products
  const { data: slotsData } = trpc.user.slots.getSlots.useQuery();
  const { data: productsData } = trpc.common.product.getAllProductsSummary.useQuery();

  const createSnippet = useCreateVendorSnippet();
  const updateSnippet = useUpdateVendorSnippet();

  const isEditing = !!snippet;

  const formik = useFormik({
    initialValues: {
      snippetCode: snippet?.snippetCode || '',
      slotId: snippet?.slotId?.toString() || '',
      productIds: snippet?.productIds?.map(id => id.toString()) || [],
      validTill: snippet?.validTill ? new Date(snippet.validTill) : null,
    },
    validate: (values) => {
      const errors: {[key: string]: string} = {};

      if (!values.snippetCode.trim()) {
        errors.snippetCode = 'Snippet code is required';
      }

      if (!values.slotId) {
        errors.slotId = 'Slot selection is required';
      }

      if (values.productIds.length === 0) {
        errors.productIds = 'At least one product must be selected';
      }

      return errors;
    },
    onSubmit: async (values) => {
      try {
        const submitData = {
          snippetCode: values.snippetCode,
          slotId: parseInt(values.slotId),
          productIds: values.productIds.map(id => parseInt(id)),
          validTill: values.validTill?.toISOString(),
        };

        if (isEditing && snippet) {
          await updateSnippet.mutateAsync({
            id: snippet.id,
            updates: submitData,
          });
          Alert.alert('Success', 'Vendor snippet updated successfully');
        } else {
          await createSnippet.mutateAsync(submitData);
          Alert.alert('Success', 'Vendor snippet created successfully');
        }

        onSuccess();
        onClose();
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to save vendor snippet');
      }
    },
  });

  // Generate unique snippet code if creating new (only on mount)
  useEffect(() => {
    if (!isEditing && !formik.values.snippetCode) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      formik.setFieldValue('snippetCode', `VS_${timestamp}_${random}`.toUpperCase());
    }
  }, [isEditing]); // Removed formik.values.snippetCode from deps



  const slotOptions = slotsData?.slots.map(slot => ({
    label: new Date(slot.deliveryTime).toLocaleString(),
    value: slot.id.toString(),
  })) || [];

  const productOptions = productsData?.products.map(product => ({
    label: `${product.name} (${product.unit})`,
    value: product.id.toString(),
  })) || [];

  const selectedProductLabels = formik.values.productIds
    .map(id => productOptions.find(opt => opt.value === id)?.label)
    .filter(Boolean)
    .join(', ');

  return (
    <View style={tw`flex-1 bg-white`}>
      <View style={tw`px-6 py-4 border-b border-gray-200`}>
        <View style={tw`flex-row justify-between items-center`}>
          <MyText style={tw`text-xl font-bold text-gray-800`}>
            {isEditing ? 'Edit Vendor Snippet' : 'Create Vendor Snippet'}
          </MyText>
          <TouchableOpacity
            onPress={onClose}
            style={tw`p-2`}
          >
            <MyText style={tw`text-gray-500 text-lg`}>✕</MyText>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={tw`flex-1 px-6`} showsVerticalScrollIndicator={false}>
        <View style={tw`py-6 space-y-6`}>
          {/* Snippet Code */}
          <View>
            <MyTextInput
              topLabel="Snippet Code"
              value={formik.values.snippetCode}
              onChangeText={formik.handleChange('snippetCode')}
              placeholder="Enter snippet code"
              error={!!formik.errors.snippetCode && formik.touched.snippetCode}
            />
            {formik.errors.snippetCode && formik.touched.snippetCode && (
              <MyText style={tw`text-red-500 text-sm mt-1`}>{formik.errors.snippetCode}</MyText>
            )}
          </View>

          {/* Slot Selection */}
          <View>
            <MyText style={tw`text-gray-700 font-medium mb-2`}>Delivery Slot</MyText>
            <BottomDropdown
              label="Select Slot"
              value={formik.values.slotId}
              options={slotOptions}
              onValueChange={(value) => formik.setFieldValue('slotId', value)}
              placeholder="Choose a delivery slot"
            />
            {formik.errors.slotId && formik.touched.slotId && (
              <MyText style={tw`text-red-500 text-sm mt-1`}>{formik.errors.slotId}</MyText>
            )}
          </View>

          {/* Product Selection */}
          <View>
            <MyText style={tw`text-gray-700 font-medium mb-2`}>Products</MyText>
            <BottomDropdown
              label="Select Products"
              value={formik.values.productIds}
              options={productOptions}
              onValueChange={(values) => formik.setFieldValue('productIds', values)}
              multiple={true}
              placeholder="Select products"
            />
            {formik.values.productIds.length > 0 && (
              <MyText style={tw`text-sm text-gray-600 mt-2`}>
                Selected: {selectedProductLabels}
              </MyText>
            )}
            {formik.errors.productIds && formik.touched.productIds && (
              <MyText style={tw`text-red-500 text-sm mt-1`}>{formik.errors.productIds}</MyText>
            )}
          </View>

          {/* Valid Till Date */}
          <View>
            <MyText style={tw`text-gray-700 font-medium mb-2`}>Valid Till (Optional)</MyText>
            <DatePicker
              value={formik.values.validTill}
              setValue={(date) => formik.setFieldValue('validTill', date)}
              placeholder="Select expiry date"
              showLabel={false}
            />
            <MyText style={tw`text-sm text-gray-500 mt-1`}>
              Leave empty for no expiry
            </MyText>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={tw`px-6 py-4 border-t border-gray-200`}>
        <TouchableOpacity
          onPress={() => formik.handleSubmit()}
          disabled={formik.isSubmitting}
          style={tw`bg-blue-500 py-3 rounded-lg ${formik.isSubmitting ? 'opacity-50' : ''}`}
        >
          <MyText style={tw`text-white text-center font-semibold`}>
            {formik.isSubmitting
              ? 'Saving...'
              : isEditing ? 'Update Snippet' : 'Create Snippet'
            }
          </MyText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default VendorSnippetForm;