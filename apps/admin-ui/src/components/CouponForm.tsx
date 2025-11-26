import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { MyTextInput, MyButton, tw, AppContainer } from 'common-ui';
import { trpc } from '../trpc-client';
import { BottomDropdown, DateTimePickerMod } from 'common-ui';
import { DropdownOption } from 'common-ui/src/components/bottom-dropdown';
import { CreateCouponPayload } from 'common-ui/shared-types';

interface CouponFormProps {
  onSubmit: (values: CreateCouponPayload) => void;
  isLoading: boolean;
  initialValues?: Partial<CreateCouponPayload>;
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
  targetUsers: Yup.array().of(Yup.number()).when(['isUserBased', 'isApplyForAll'], {
    is: (isUserBased: boolean, isApplyForAll: boolean) => isUserBased && !isApplyForAll,
    then: (schema) => schema.min(1, 'At least one user must be selected for user-based coupons'),
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

export default function CouponForm({ onSubmit, isLoading, initialValues }: CouponFormProps) {
  const { height: screenHeight } = Dimensions.get('window');
  const maxFormHeight = screenHeight * 0.75;

  const { data: productsData } = trpc.common.product.getAllProductsSummary.useQuery({});
  const products = productsData?.products || [];

  const productOptions: DropdownOption[] = products.map(product => ({
    label: `${product.name} (${product.unit})`,
    value: product.id.toString(),
  }));

  // User search functionality will be inside Formik

  const defaultValues: CreateCouponPayload = {
    couponCode: '',
    isUserBased: false,
    isApplyForAll: false,
    targetUsers: [],
    discountPercent: undefined,
    flatDiscount: undefined,
    minOrder: undefined,
    maxValue: undefined,
    validTill: undefined,
    maxLimitForUser: undefined,
    productIds: undefined,
  };

  return (
    <Formik
      initialValues={(initialValues || defaultValues) as CreateCouponPayload}
      validationSchema={couponValidationSchema}
      onSubmit={onSubmit}
    >
      {({ values, errors, touched, setFieldValue, handleSubmit }) => {
        // User search functionality
        const [userSearchQuery, setUserSearchQuery] = useState('');
        const { data: usersData } = trpc.admin.coupon.getUsersMiniInfo.useQuery(
          { search: userSearchQuery, limit: 20 },
          { enabled: values.isUserBased && userSearchQuery.length > 0 }
        );

        const users = usersData?.users || [];
        const userOptions: DropdownOption[] = users.map(user => ({
          label: `${user.name} (${user.mobile})`,
          value: user.id.toString(),
        }));

        return (
        <AppContainer>
          {/* Coupon Code */}
          <View style={tw`mb-4`}>
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
           <Text style={tw`text-base font-bold mb-2`}>
             Discount Type *
           </Text>

           <View style={tw`flex-row mb-4`}>
            <TouchableOpacity
              onPress={() => {
                setFieldValue('discountPercent', values.discountPercent || 0);
                setFieldValue('flatDiscount', undefined);
              }}
              style={tw`flex-1 p-3 border rounded-lg mr-2 ${
                values.discountPercent !== undefined ? 'border-blue-500' : 'border-gray-300'
              }`}
            >
              <Text style={{ textAlign: 'center' }}>Percentage</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setFieldValue('flatDiscount', values.flatDiscount || 0);
                setFieldValue('discountPercent', undefined);
              }}
              style={tw`flex-1 p-3 border rounded-lg ${
                values.flatDiscount !== undefined ? 'border-blue-500' : 'border-gray-300'
              }`}
            >
              <Text style={{ textAlign: 'center' }}>Flat Amount</Text>
            </TouchableOpacity>
          </View>

          {/* Discount Value */}
          {values.discountPercent !== undefined && (
            <View style={tw`mb-4`}>
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
            <View style={tw`mb-4`}>
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
          <View style={tw`mb-4`}>
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
          <View style={tw`mb-4`}>
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
          <View style={tw`mb-4`}>
            <Text style={tw`text-base mb-2`}>Valid Till</Text>
            <DateTimePickerMod
              value={values.validTill ? new Date(values.validTill) : null}
              setValue={(date) => {
                
                setFieldValue('validTill', date?.toISOString())
              }}
            />
          </View>

          {/* Usage Limit */}
          <View style={tw`mb-4`}>
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
          <Text style={tw`text-base font-bold mb-2`}>
            Target Audience
          </Text>

          <View style={tw`flex-row mb-4`}>
              <TouchableOpacity
                onPress={() => {
                  setFieldValue('isApplyForAll', true);
                  setFieldValue('isUserBased', false);
                  setFieldValue('targetUsers', []);
                }}
                style={tw`flex-1 p-3 border rounded-lg mr-2 ${
                  values.isApplyForAll ? 'border-blue-500' : 'border-gray-300'
                }`}
            >
              <Text style={{ textAlign: 'center' }}>All Users</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setFieldValue('isUserBased', true);
                setFieldValue('isApplyForAll', false);
              }}
              style={tw`flex-1 p-3 border rounded-lg ${
                values.isUserBased ? 'border-blue-500' : 'border-gray-300'
              }`}
            >
              <Text style={{ textAlign: 'center' }}>Specific User</Text>
            </TouchableOpacity>
          </View>

            {/* Target User Selection (if user-based) */}
            {values.isUserBased && (
              <View style={tw`mb-4`}>
                <Text style={tw`text-base mb-2`}>Target Users *</Text>
                <BottomDropdown
                  label="Target Users"
                  options={userOptions}
                  value={values.targetUsers ? values.targetUsers.map(id => id.toString()) : []}
                   onValueChange={(value) => {
                     const selectedValues = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
                     setFieldValue('targetUsers', selectedValues.map(v => Number(v)));
                   }}
                  onSearch={(query) => {
                    setUserSearchQuery(query);
                  }}
                  placeholder="Search and select users..."
                  // multiple={true}
                  error={!!(touched.targetUsers && errors.targetUsers)}
                />
              </View>
            )}

            {/* Product Selection */}
            <View style={tw`mb-4`}>
              <Text style={tw`text-base mb-2`}>Target Products (Optional)</Text>
              <BottomDropdown
                label="Target Products"
                options={productOptions}
                value={values.productIds ? values.productIds.map(id => id.toString()) : []}
                 onValueChange={(value) => {
                   const selectedValues = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
                   setFieldValue('productIds', selectedValues.map(v => Number(v)));
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
         </AppContainer>
        );
      }}
     </Formik>
  );
}