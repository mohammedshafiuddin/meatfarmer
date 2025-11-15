import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { Formik, FieldArray } from 'formik';
import * as Yup from 'yup';
import { MyTextInput, BottomDropdown, MyText, ImageUploader, ImageGalleryWithDelete, useTheme, DatePicker, tw, useFocusCallback } from 'common-ui';
import usePickImage from 'common-ui/src/components/use-pick-image';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { trpc } from '../trpc-client';

interface ProductFormData {
  name: string;
  shortDescription: string;
  longDescription: string;
  unitId: number;
  storeId: number;
  price: string;
  marketPrice: string;
  deals: Deal[];
}

interface Deal {
  quantity: string;
  price: string;
  validTill: Date | null;
}

export interface ProductFormRef {
  clearImages: () => void;
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  initialValues: ProductFormData;
  onSubmit: (values: ProductFormData, images?: { uri?: string }[], imagesToDelete?: string[]) => void;
  isLoading: boolean;
  existingImages?: string[];
}

const unitOptions = [
  { label: 'Kg', value: 1 },
  { label: 'Dozen', value: 2 },
  { label: 'Unit Piece', value: 3 },
  { label: 'Litre', value: 4 },
];

const ProductForm = forwardRef<ProductFormRef, ProductFormProps>(({
  mode,
  initialValues,
  onSubmit,
  isLoading,
  existingImages = []
}, ref) => {
  const { theme } = useTheme();
  const [images, setImages] = useState<{ uri?: string }[]>([]);
  const [existingImagesState, setExistingImagesState] = useState<string[]>(existingImages);

  const { data: storesData } = trpc.common.getStoresSummary.useQuery();
  const storeOptions = storesData?.stores.map(store => ({
    label: store.name,
    value: store.id,
  })) || [];

  // Initialize existing images state when existingImages prop changes
  useEffect(() => {
    console.log('changing existing imaes statte')
    
    setExistingImagesState(existingImages);
  }, [existingImages]);

  // Clear newly added images when screen comes into focus
  const clearImages = useCallback(() => {
    setImages([]);
  }, []);

  useFocusCallback(clearImages);

  // Expose clearImages method via ref
  useImperativeHandle(ref, () => ({
    clearImages,
  }), [clearImages]);

  const pickImage = usePickImage({
    setFile: (files) => setImages(prev => [...prev, ...files]),
    multiple: true,
  });

  // Calculate which existing images were deleted
  const deletedImages = existingImages.filter(img => !existingImagesState.includes(img));

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={(values) => onSubmit(values, images, deletedImages)}
    >
      {({ handleChange, handleSubmit, values, setFieldValue }) => {
        const submit = () => handleSubmit();

        return (
          <View>
            <MyTextInput
              topLabel="Product Name"
              placeholder="Enter product name"
              value={values.name}
              onChangeText={handleChange('name')}
              style={{ marginBottom: 16 }}
            />
            <MyTextInput
              topLabel="Short Description"
              placeholder="Enter short description"
              multiline
              numberOfLines={2}
              value={values.shortDescription}
              onChangeText={handleChange('shortDescription')}
              style={{ marginBottom: 16 }}
            />
            <MyTextInput
              topLabel="Long Description"
              placeholder="Enter detailed description"
              multiline
              numberOfLines={4}
              value={values.longDescription}
              onChangeText={handleChange('longDescription')}
              style={{ marginBottom: 16 }}
            />

            {mode === 'create' && (
              <ImageUploader
                images={images}
                onAddImage={pickImage}
                onRemoveImage={(uri) => setImages(prev => prev.filter(img => img.uri !== uri))}
              />
            )}

            {mode === 'edit' && existingImagesState.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <MyText style={tw`text-lg font-bold mb-2 text-gray-800`}>Current Images</MyText>
                <ImageGalleryWithDelete
                  imageUrls={existingImagesState}
                  setImageUrls={setExistingImagesState}
                  imageHeight={100}
                  imageWidth={100}
                  columns={3}
                />
              </View>
            )}

            {mode === 'edit' && (
              <View style={{ marginBottom: 16 }}>
                <MyText style={tw`text-lg font-bold mb-2 text-gray-800`}>Add New Images</MyText>
                <ImageUploader
                  images={images}
                  onAddImage={pickImage}
                  onRemoveImage={(uri) => setImages(prev => prev.filter(img => img.uri !== uri))}
                />
              </View>
            )}

            <BottomDropdown
              label="Unit"
              value={values.unitId}
              options={unitOptions}
              // onValueChange={(value) => handleChange('unitId')(value+'')}
              onValueChange={(value) => setFieldValue('unitId', value)}
              placeholder="Select unit"
              style={{ marginBottom: 16 }}
            />
            <BottomDropdown
              label="Store"
              value={values.storeId}
              options={storeOptions}
              onValueChange={(value) => setFieldValue('storeId', value)}
              placeholder="Select store"
              style={{ marginBottom: 16 }}
            />
            <MyTextInput
              topLabel="Unit Price"
              placeholder="Enter unit price"
              keyboardType="numeric"
              value={values.price}
              onChangeText={handleChange('price')}
              style={{ marginBottom: 16 }}
            />
            <MyTextInput
              topLabel="Market Price (Optional)"
              placeholder="Enter market price"
              keyboardType="numeric"
              value={values.marketPrice}
              onChangeText={handleChange('marketPrice')}
              style={{ marginBottom: 16 }}
            />

            <FieldArray name="deals">
              {({ push, remove, form }) => (
                <View style={{ marginBottom: 16 }}>
                  <View style={tw`flex-row items-center mb-4`}>
                    <MaterialIcons name="local-offer" size={20} color="#3B82F6" />
                    <MyText style={tw`text-lg font-bold text-gray-800 ml-2`}>
                      Special Package Deals
                    </MyText>
                    <MyText style={tw`text-sm text-gray-500 ml-1`}>(Optional)</MyText>
                  </View>
                  {(form.values.deals || []).map((deal: any, index: number) => (
                      <View key={index} style={tw`bg-white p-4 rounded-2xl shadow-lg mb-4 border border-gray-100`}>
                        <View style={tw`mb-3`}>
                          <View style={tw`flex-row items-end gap-3 mb-3`}>
                            <View style={tw`flex-1`}>
                              <MyTextInput
                                topLabel="Quantity"
                                placeholder="Enter quantity"
                                keyboardType="numeric"
                                value={deal.quantity || ''}
                                onChangeText={form.handleChange(`deals.${index}.quantity`)}
                                fullWidth={false}
                              />
                            </View>
                            <View style={tw`flex-1`}>
                              <MyTextInput
                                topLabel="Price"
                                placeholder="Enter price"
                                keyboardType="numeric"
                                value={deal.price || ''}
                                onChangeText={form.handleChange(`deals.${index}.price`)}
                                fullWidth={false}
                              />
                            </View>
                          </View>
                          <View style={tw`flex-row items-end gap-3`}>
                            <View style={tw`flex-1`}>
                              <DatePicker
                                value={deal.validTill}
                                setValue={(date) => form.setFieldValue(`deals.${index}.validTill`, date)}
                                showLabel={true}
                                placeholder="Valid Till"
                              />
                            </View>
                            <View style={tw`flex-1`}>
                              <TouchableOpacity
                                onPress={() => remove(index)}
                                style={tw`bg-red-500 p-3 rounded-lg shadow-md flex-row items-center justify-center`}
                              >
                                <MaterialIcons name="delete" size={16} color="white" />
                                <MyText style={tw`text-white font-semibold ml-1`}>Remove</MyText>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                     </View>
                   ))}

                   {(form.values.deals || []).length === 0 && (
                     <View style={tw`bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-300 items-center mb-4`}>
                       <MaterialIcons name="local-offer" size={32} color="#9CA3AF" />
                       <MyText style={tw`text-gray-500 text-center mt-2`}>
                         No package deals added yet
                       </MyText>
                       <MyText style={tw`text-gray-400 text-sm text-center mt-1`}>
                         Add special pricing for bulk purchases
                       </MyText>
                     </View>
                   )}

                   <TouchableOpacity
                      onPress={() => push({ quantity: '', price: '', validTill: null })}
                      style={tw`bg-green-500 px-4 py-2 rounded-lg shadow-lg flex-row items-center justify-center mt-4`}
                    >
                      <MaterialIcons name="add" size={20} color="white" />
                      <MyText style={tw`text-white font-bold text-lg ml-2`}>Add Package Deal</MyText>
                    </TouchableOpacity>
                </View>
              )}
            </FieldArray>

             <TouchableOpacity
               onPress={submit}
               disabled={isLoading}
               style={tw`px-4 py-2 rounded-lg shadow-lg items-center mt-2 ${isLoading ? 'bg-gray-400' : 'bg-blue-500'}`}
             >
              <MyText style={tw`text-white text-lg font-bold`}>
                {isLoading ? (mode === 'create' ? 'Creating...' : 'Updating...') : (mode === 'create' ? 'Create Product' : 'Update Product')}
              </MyText>
            </TouchableOpacity>
          </View>
        );
      }}
    </Formik>
  );
});

ProductForm.displayName = 'ProductForm';

export default ProductForm;