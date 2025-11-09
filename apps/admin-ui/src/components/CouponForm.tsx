import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { MyTextInput, MyButton } from 'common-ui';
import { CreateCouponPayload } from 'common-ui/shared-types';
import DateTimePickerMod from '../../components/date-time-picker';
import { trpc } from '../trpc-client';
import { BottomDropdown } from 'common-ui';
import { DropdownOption } from 'common-ui/src/components/bottom-dropdown';

interface CouponFormProps {
  onSubmit: (values: CreateCouponPayload) => void;
  isLoading: boolean;
}

const couponValidationSchema = Yup.object().shape({
  couponCode: Yup.string()
    .required('Coupon code is required')
    .min(3, 'Coupon code must be at least 3 characters')
    .max(50, 'Coupon code cannot exceed 50 characters')
    .matches(/^[A-Z0-9_-]+$/, 'Coupon code can only contain uppercase letters, numbers, underscores, and hyphens'),
  discountPercent: Yup.number()
    .min(0, 'Must be positive')
    .max(100, 'Cannot exceed 100%')
    .optional(),
  flatDiscount: Yup.number()
    .min(0, 'Must be positive')
    .optional(),
  minOrder: Yup.number().min(0, 'Must be positive').optional(),
  maxValue: Yup.number().min(0, 'Must be positive').optional(),
  validTill: Yup.date().optional(),
  maxLimitForUser: Yup.number().min(1, 'Must be at least 1').optional(),
  isUserBased: Yup.boolean(),
  isApplyForAll: Yup.boolean(),
  targetUser: Yup.number().when(['isUserBased', 'isApplyForAll'], {
    is: (isUserBased: boolean, isApplyForAll: boolean) => isUserBased && !isApplyForAll,
    then: (schema) => schema.required('Target user is required for user-based coupons'),
    otherwise: (schema) => schema.optional(),
  }),
}).test('discount-validation', 'Must provide exactly one discount type with valid value', function(value) {
  const { discountPercent, flatDiscount } = value;
  const hasPercent = discountPercent !== undefined && discountPercent > 0;
  const hasFlat = flatDiscount !== undefined && flatDiscount > 0;

  if (hasPercent && hasFlat) {
    return this.createError({ message: 'Cannot have both percentage and flat discount' });
  }
  if (!hasPercent && !hasFlat) {
    return this.createError({ message: 'Must provide either percentage or flat discount' });
  }
  return true;
});

export default function CouponForm({ onSubmit, isLoading }: CouponFormProps) {
  const { height: screenHeight } = Dimensions.get('window');
  const maxFormHeight = screenHeight * 0.75;

  const { data: productsData } = trpc.common.product.getAllProductsSummary.useQuery();
  const products = productsData?.products || [];

  const productOptions: DropdownOption[] = products.map(product => ({
    label: `${product.name} (${product.unit})`,
    value: product.id.toString(),
  }));

  const defaultValues: CreateCouponPayload = {
    couponCode: '',
    isUserBased: false,
    isApplyForAll: false,
  };

  return (
    <Formik
      initialValues={defaultValues}
      validationSchema={couponValidationSchema}
      onSubmit={onSubmit}
    >
      {({ values, errors, touched, setFieldValue, handleSubmit }) => (
        <ScrollView
          style={{
            padding: 16,
            maxHeight: maxFormHeight
          }}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          {/* Coupon Code */}
          <View style={{ marginBottom: 16 }}>
            <MyTextInput
              topLabel="Coupon Code"
              placeholder="e.g., SAVE20"
              value={values.couponCode || ''}
              onChangeText={(text: string) => setFieldValue('couponCode', text.toUpperCase())}
              keyboardType="default"
              autoCapitalize="characters"
              error={!!(touched.couponCode && errors.couponCode)}
            />
          </View>

          {/* Discount Type Selection */}
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
            Discount Type *
          </Text>

          <View style={{ flexDirection: 'row', marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => {
                setFieldValue('discountPercent', values.discountPercent || 0);
                setFieldValue('flatDiscount', undefined);
              }}
              style={{
                flex: 1,
                padding: 12,
                borderWidth: 1,
                borderColor: values.discountPercent !== undefined ? '#007AFF' : '#ccc',
                borderRadius: 8,
                marginRight: 8,
              }}
            >
              <Text style={{ textAlign: 'center' }}>Percentage</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setFieldValue('flatDiscount', values.flatDiscount || 0);
                setFieldValue('discountPercent', undefined);
              }}
              style={{
                flex: 1,
                padding: 12,
                borderWidth: 1,
                borderColor: values.flatDiscount !== undefined ? '#007AFF' : '#ccc',
                borderRadius: 8,
              }}
            >
              <Text style={{ textAlign: 'center' }}>Flat Amount</Text>
            </TouchableOpacity>
          </View>

          {/* Discount Value */}
          {values.discountPercent !== undefined && (
            <View style={{ marginBottom: 16 }}>
                <MyTextInput
                 topLabel="Discount Percentage *"
                 placeholder="e.g., 10"
                 value={values.discountPercent?.toString() || ''}
                 onChangeText={(text: string) => setFieldValue('discountPercent', parseFloat(text) || 0)}
                 keyboardType="numeric"
                 error={!!(touched.discountPercent && errors.discountPercent)}
               />
            </View>
          )}

          {values.flatDiscount !== undefined && (
            <View style={{ marginBottom: 16 }}>
                <MyTextInput
                 topLabel="Flat Discount Amount *"
                 placeholder="e.g., 50"
                 value={values.flatDiscount?.toString() || ''}
                 onChangeText={(text: string) => setFieldValue('flatDiscount', parseFloat(text) || 0)}
                 keyboardType="numeric"
                 error={!!(touched.flatDiscount && errors.flatDiscount)}
               />
            </View>
          )}

          {/* Minimum Order */}
          <View style={{ marginBottom: 16 }}>
            <MyTextInput
              topLabel="Minimum Order Amount"
              placeholder="e.g., 100"
              value={values.minOrder?.toString() || ''}
              onChangeText={(text: string) => setFieldValue('minOrder', parseFloat(text) || undefined)}
              keyboardType="numeric"
              error={!!(touched.minOrder && errors.minOrder)}
            />
          </View>

          {/* Maximum Discount Value */}
          <View style={{ marginBottom: 16 }}>
            <MyTextInput
              topLabel="Maximum Discount Value"
              placeholder="e.g., 200"
              value={values.maxValue?.toString() || ''}
              onChangeText={(text: string) => setFieldValue('maxValue', parseFloat(text) || undefined)}
              keyboardType="numeric"
              error={!!(touched.maxValue && errors.maxValue)}
            />
          </View>

          {/* Validity Period */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 16, marginBottom: 8 }}>Valid Till</Text>
            <DateTimePickerMod
              value={values.validTill ? new Date(values.validTill) : null}
              setValue={(date) => setFieldValue('validTill', date?.toISOString())}
            />
          </View>

          {/* Usage Limit */}
          <View style={{ marginBottom: 16 }}>
            <MyTextInput
              topLabel="Max Uses Per User"
              placeholder="e.g., 5"
              value={values.maxLimitForUser?.toString() || ''}
              onChangeText={(text: string) => setFieldValue('maxLimitForUser', parseInt(text) || undefined)}
              keyboardType="numeric"
              error={!!(touched.maxLimitForUser && errors.maxLimitForUser)}
            />
          </View>

          {/* Target Audience */}
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
            Target Audience
          </Text>

          <View style={{ flexDirection: 'row', marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => {
                setFieldValue('isApplyForAll', true);
                setFieldValue('isUserBased', false);
                setFieldValue('targetUser', undefined);
              }}
              style={{
                flex: 1,
                padding: 12,
                borderWidth: 1,
                borderColor: values.isApplyForAll ? '#007AFF' : '#ccc',
                borderRadius: 8,
                marginRight: 8,
              }}
            >
              <Text style={{ textAlign: 'center' }}>All Users</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setFieldValue('isUserBased', true);
                setFieldValue('isApplyForAll', false);
              }}
              style={{
                flex: 1,
                padding: 12,
                borderWidth: 1,
                borderColor: values.isUserBased ? '#007AFF' : '#ccc',
                borderRadius: 8,
              }}
            >
              <Text style={{ textAlign: 'center' }}>Specific User</Text>
            </TouchableOpacity>
          </View>

           {/* Target User Selection (if user-based) */}
           {values.isUserBased && (
             <View style={{ marginBottom: 16 }}>
               <MyTextInput
                 topLabel="Target User ID *"
                 placeholder="e.g., 123"
                 value={values.targetUser?.toString() || ''}
                 onChangeText={(text) => setFieldValue('targetUser', parseInt(text) || undefined)}
                 keyboardType="numeric"
                 error={!!(touched.targetUser && errors.targetUser)}
               />
             </View>
           )}

            {/* Product Selection */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 16, marginBottom: 8 }}>Target Products (Optional)</Text>
              <BottomDropdown
                label="Target Products"
                options={productOptions}
                value={values.productIds ? values.productIds.map(id => id.toString()) : []}
                onValueChange={(selectedValues) => {
                  setFieldValue('productIds', (selectedValues as string[]).map(v => Number(v)));
                }}
                placeholder="Select products (optional)"
                multiple={true}
              />
            </View>



           {/* Submit Button */}
          <MyButton
            onPress={() => handleSubmit()}
            loading={isLoading}
            disabled={isLoading}
          >
            Create Coupon
          </MyButton>
        </ScrollView>
      )}
    </Formik>
  );
}