 import React, { useState } from 'react';
 import { View, TouchableOpacity, Image } from 'react-native';
 import { Formik, FieldArray } from 'formik';
 import * as Yup from 'yup';
 import { MyTextInput, CustomDropdown, MyText as Text, ImageUploader, useTheme, DatePicker } from 'common-ui';
 import usePickImage from 'common-ui/src/components/use-pick-image';

interface ProductFormData {
  name: string;
  shortDescription: string;
  longDescription: string;
  unitId: number;
  price: string;
  deals: Deal[];
}

interface Deal {
  quantity: string;
  price: string;
  validTill: Date | null;
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  initialValues: ProductFormData;
  onSubmit: (values: ProductFormData, images?: { uri?: string }[]) => void;
  isLoading: boolean;
  existingImages?: string[];
}

const unitOptions = [
  { label: 'Kg', value: 1 },
  { label: 'Dozen', value: 2 },
  { label: 'Unit Piece', value: 3 },
  { label: 'Litre', value: 4 },
];

const ProductForm: React.FC<ProductFormProps> = ({
  mode,
  initialValues,
  onSubmit,
  isLoading,
  existingImages = []
}) => {
  const { theme } = useTheme();
  const [images, setImages] = useState<{ uri?: string }[]>([]);

  const pickImage = usePickImage({
    setFile: (files) => setImages(prev => [...prev, ...files]),
    multiple: true,
  });

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={(values) => onSubmit(values, images)}
    >
      {({ handleChange, handleSubmit, values }) => {
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

            {mode === 'edit' && existingImages.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>Current Images</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {existingImages.map((imageUrl, index) => (
                    <Image
                      key={index}
                      source={{ uri: imageUrl }}
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 8,
                        marginRight: 8,
                        marginBottom: 8
                      }}
                    />
                  ))}
                </View>
              </View>
            )}

            <CustomDropdown
              label="Unit"
              value={values.unitId}
              options={unitOptions}
              onValueChange={(value) => handleChange('unitId')(value+'')}
              placeholder="Select unit"
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

            <FieldArray name="deals">
              {({ push, remove, form }) => (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>Special Package Deals (Optional)</Text>
                  {(form.values.deals || []).map((deal: any, index: number) => (
                     <View key={index} style={{ marginBottom: 16 }}>
                       <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 }}>
                         <View style={{ flex: 1, marginRight: 8 }}>
                           <MyTextInput
                             topLabel="Quantity"
                             placeholder="Enter quantity"
                             keyboardType="numeric"
                             value={deal.quantity || ''}
                             onChangeText={form.handleChange(`deals.${index}.quantity`)}
                             fullWidth={false}
                           />
                         </View>
                         <View style={{ flex: 1, marginRight: 8 }}>
                           <MyTextInput
                             topLabel="Price"
                             placeholder="Enter price"
                             keyboardType="numeric"
                             value={deal.price || ''}
                             onChangeText={form.handleChange(`deals.${index}.price`)}
                             fullWidth={false}
                           />
                         </View>
                         <View style={{ flex: 1, marginRight: 8 }}>
                           <DatePicker
                             value={deal.validTill}
                             setValue={(date) => form.setFieldValue(`deals.${index}.validTill`, date)}
                             showLabel={true}
                             placeholder="Valid Till"
                           />
                         </View>
                         <TouchableOpacity
                           onPress={() => remove(index)}
                           style={{
                             backgroundColor: '#dc3545',
                             padding: 8,
                             borderRadius: 4,
                             justifyContent: 'center',
                             alignItems: 'center',
                             height: 40,
                           }}
                         >
                           <Text style={{ color: 'white', fontSize: 12 }}>Remove</Text>
                         </TouchableOpacity>
                       </View>
                     </View>
                  ))}
                   <TouchableOpacity
                     onPress={() => push({ quantity: '', price: '', validTill: null })}
                     style={{
                       backgroundColor: '#28a745',
                       padding: 10,
                       borderRadius: 4,
                       alignItems: 'center',
                       marginTop: 8,
                     }}
                   >
                     <Text style={{ color: 'white', fontSize: 14 }}>Add Deal</Text>
                   </TouchableOpacity>
                </View>
              )}
            </FieldArray>

            <TouchableOpacity
              onPress={submit}
              disabled={isLoading}
              style={{
                backgroundColor: isLoading ? theme.colors.gray3 : theme.colors.blue1,
                padding: 16,
                borderRadius: 8,
                alignItems: 'center',
                marginTop: 16,
              }}
            >
              <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                {isLoading ? (mode === 'create' ? 'Creating...' : 'Updating...') : (mode === 'create' ? 'Create Product' : 'Update Product')}
              </Text>
            </TouchableOpacity>
          </View>
        );
      }}
    </Formik>
  );
};

export default ProductForm;