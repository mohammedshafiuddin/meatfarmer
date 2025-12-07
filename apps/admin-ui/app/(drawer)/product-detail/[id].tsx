import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, TextInput, Dimensions, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { tw, AppContainer, MyText, useMarkDataFetchers, BottomDialog, ImageUploader, ImageCarousel } from 'common-ui';
import { MaterialIcons, FontAwesome5, Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { trpc } from '@/src/trpc-client';
import usePickImage from 'common-ui/src/components/use-pick-image';
import { Formik } from 'formik';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get("window");
const carouselHeight = screenWidth * 0.85;

interface ReviewResponseFormProps {
  reviewId: number;
  onClose: () => void;
}

const ReviewResponseForm: React.FC<ReviewResponseFormProps> = ({ reviewId, onClose }) => {
  const [adminResponse, setAdminResponse] = useState('');
  const [selectedImages, setSelectedImages] = useState<{ blob: Blob; mimeType: string }[]>([]);
  const [displayImages, setDisplayImages] = useState<{ uri?: string }[]>([]);
  const [uploadUrls, setUploadUrls] = useState<string[]>([]);

  const respondToReview = trpc.admin.product.respondToReview.useMutation();
  const generateUploadUrls = trpc.user.fileUpload.generateUploadUrls.useMutation();

  const handleImagePick = usePickImage({
    setFile: async (assets: any) => {
      if (!assets || (Array.isArray(assets) && assets.length === 0)) {
        setSelectedImages([]);
        setDisplayImages([]);
        return;
      }

      const files = Array.isArray(assets) ? assets : [assets];
      const blobPromises = files.map(async (asset) => {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        return { blob, mimeType: asset.mimeType || 'image/jpeg' };
      });

      const blobArray = await Promise.all(blobPromises);
      setSelectedImages(blobArray);
      setDisplayImages(files.map(asset => ({ uri: asset.uri })));
    },
    multiple: true,
  });

  const handleRemoveImage = (uri: string) => {
    const index = displayImages.findIndex(img => img.uri === uri);
    if (index !== -1) {
      const newDisplay = displayImages.filter((_, i) => i !== index);
      const newFiles = selectedImages.filter((_, i) => i !== index);
      setDisplayImages(newDisplay);
      setSelectedImages(newFiles);
    }
  };

  const handleSubmit = async (adminResponse: string) => {
    try {
      const mimeTypes = selectedImages.map(s => s.mimeType);
      const { uploadUrls: generatedUrls } = await generateUploadUrls.mutateAsync({
        contextString: 'review',
        mimeTypes,
      });
      const keys = generatedUrls.map(url => {
        const u = new URL(url);
        const rawKey = u.pathname.replace(/^\/+/, "");
        const decodedKey = decodeURIComponent(rawKey);
        const parts = decodedKey.split('/');
        parts.shift();
        return parts.join('/');
      });
      setUploadUrls(generatedUrls);

      for (let i = 0; i < generatedUrls.length; i++) {
        const uploadUrl = generatedUrls[i];
        const { blob, mimeType } = selectedImages[i];
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: blob,
          headers: { 'Content-Type': mimeType },
        });
        if (!uploadResponse.ok) throw new Error(`Upload failed with status ${uploadResponse.status}`);
      }

      await respondToReview.mutateAsync({
        reviewId,
        adminResponse,
        adminResponseImages: keys,
        uploadUrls: generatedUrls,
      });

      Alert.alert('Success', 'Response submitted');
      onClose();
      setAdminResponse('');
      setSelectedImages([]);
      setDisplayImages([]);
      setUploadUrls([]);
    } catch (error) {
      console.log({ error: JSON.stringify(error) })
      Alert.alert('Error', 'Failed to submit response.');
    }
  };

  return (
    <Formik
      initialValues={{ adminResponse: '', images: [] }}
      onSubmit={(values) => handleSubmit(values.adminResponse)}
    >
      {({ handleChange, handleSubmit: formikSubmit, values }) => (
        <View>
          <TextInput
            style={tw`border border-gray-200 bg-gray-50 rounded-2xl p-4 mb-4 h-32 text-gray-900 text-base shadow-sm`}
            placeholder="Write your response here..."
            placeholderTextColor="#9CA3AF"
            value={values.adminResponse}
            onChangeText={handleChange('adminResponse')}
            multiline
            textAlignVertical="top"
          />

          <View style={tw`mb-6`}>
            <MyText style={tw`text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider`}>Attach Images</MyText>
            <ImageUploader
              images={displayImages}
              existingImageUrls={[]}
              onAddImage={handleImagePick}
              onRemoveImage={handleRemoveImage}
            />
          </View>

          <TouchableOpacity
            onPress={() => formikSubmit()}
            activeOpacity={0.8}
            disabled={respondToReview.isPending}
          >
            <LinearGradient
              colors={['#2563EB', '#1D4ED8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={tw`py-4 rounded-2xl items-center shadow-lg`}
            >
              {respondToReview.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <MyText style={tw`text-white font-bold text-lg`}>Submit Response</MyText>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </Formik>
  );
};

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const productId = parseInt(id as string);

  const { data: productData, isLoading, error, refetch } = trpc.admin.product.getProductById.useQuery({ id: productId });
  const { data: reviewsData } = trpc.admin.product.getProductReviews.useQuery({ productId });
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);

  useMarkDataFetchers(() => {
    refetch();
  });

  const toggleOutOfStock = trpc.admin.product.toggleOutOfStock.useMutation();

  const product = productData?.product;

  const handleEdit = () => {
    router.push(`/edit-product?id=${productId}` as any);
  };



  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <MyText style={tw`text-gray-500 mt-4 font-medium`}>Loading...</MyText>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <MaterialIcons name="error-outline" size={64} color="#EF4444" />
        <MyText style={tw`text-gray-900 text-xl font-bold mt-4`}>Product Not Found</MyText>
        <TouchableOpacity onPress={() => router.back()} style={tw`mt-6 px-8 py-3 bg-gray-100 rounded-full`}>
          <Text style={tw`text-gray-800 font-semibold`}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-32`} showsVerticalScrollIndicator={false}>

        {/* Hero Section */}
        <View style={tw`relative`}>
          {product.images && product.images.length > 0 ? (
            <ImageCarousel
              urls={product.images}
              imageWidth={screenWidth}
              imageHeight={carouselHeight}
              showPaginationDots={true}
            />
          ) : (
            <View style={{ width: screenWidth, height: carouselHeight, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }} />
          )}

          {/* Gradient Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.3)']}
            style={tw`absolute bottom-0 left-0 right-0 h-24`}
          />

          {/* Floating Header Buttons */}
          <View style={tw`absolute top-${Platform.OS === 'ios' ? '12' : '8'} left-4 right-4 flex-row justify-between items-center z-10`}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
              <BlurView intensity={80} tint="dark" style={tw`w-10 h-10 rounded-full items-center justify-center overflow-hidden`}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleEdit} activeOpacity={0.8}>
              <BlurView intensity={80} tint="dark" style={tw`px-4 py-2 rounded-full flex-row items-center overflow-hidden`}>
                <Feather name="edit-2" size={16} color="white" />
                <Text style={tw`text-white font-bold ml-2`}>Edit</Text>
              </BlurView>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Container - Overlapping the image slightly */}
        <View style={tw`-mt-8 rounded-t-[32px] bg-gray-50 overflow-hidden`}>

          {/* Main Info Card */}
          <Animated.View entering={FadeInUp.delay(100).duration(500)} style={tw`bg-white px-6 pt-8 pb-6 rounded-b-[32px] shadow-sm mb-4`}>
            <View style={tw`flex-row justify-between items-start mb-2`}>
              <MyText style={tw`text-3xl font-extrabold text-gray-900 flex-1 mr-4 leading-tight`}>{product.name}</MyText>
              <TouchableOpacity
                onPress={() => {
                  toggleOutOfStock.mutate({ id: productId }, {
                    onSuccess: () => Alert.alert('Success', 'Stock status updated'),
                    onError: (err) => Alert.alert('Error', err.message)
                  });
                }}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={product.isOutOfStock ? ['#EF4444', '#DC2626'] : ['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={tw`px-4 py-1.5 rounded-full shadow-sm`}
                >
                  <Text style={tw`text-white text-xs font-bold uppercase tracking-wide`}>
                    {product.isOutOfStock ? 'Out of Stock' : 'In Stock'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={tw`flex-row items-end mt-2`}>
              <Text style={tw`text-4xl font-black text-gray-900`}>₹{product.price}</Text>
              <Text style={tw`text-gray-500 text-xl font-medium mb-1.5 ml-2`}>/ {product.unit?.shortNotation}</Text>
              {product.marketPrice && (
                <View style={tw`ml-4 mb-2 px-2 py-0.5 bg-red-50 rounded`}>
                  <Text style={tw`text-red-400 text-base line-through font-medium`}>₹{product.marketPrice}</Text>
                </View>
              )}
            </View>

            {/* Quick Stats Row */}
            <View style={tw`flex-row mt-6 pt-6 border-t border-gray-100`}>
              <View style={tw`flex-1 items-center border-r border-gray-100`}>
                <View style={tw`flex-row items-center`}>
                  <MaterialIcons name="star" size={20} color="#F59E0B" />
                  <Text style={tw`text-lg font-bold text-gray-900 ml-1`}>
                    {reviewsData?.reviews.reduce((acc, r) => acc + r.ratings, 0)
                      ? (reviewsData.reviews.reduce((acc, r) => acc + r.ratings, 0) / reviewsData.reviews.length).toFixed(1)
                      : '-'}
                  </Text>
                </View>
                <Text style={tw`text-xs text-gray-400 font-medium mt-1 uppercase`}>Rating</Text>
              </View>
              <View style={tw`flex-1 items-center border-r border-gray-100`}>
                <Text style={tw`text-lg font-bold text-gray-900`}>{reviewsData?.reviews.length || 0}</Text>
                <Text style={tw`text-xs text-gray-400 font-medium mt-1 uppercase`}>Reviews</Text>
              </View>
               {/* <View style={tw`flex-1 items-center`}>
                 <TouchableOpacity
                   onPress={() => {
                     toggleOutOfStock.mutate({ id: productId }, {
                       onSuccess: () => Alert.alert('Success', 'Stock status updated'),
                       onError: (err) => Alert.alert('Error', err.message)
                     });
                   }}
                   activeOpacity={0.9}
                 >
                   <LinearGradient
                     colors={product.isOutOfStock ? ['#EF4444', '#DC2626'] : ['#10B981', '#059669']}
                     start={{ x: 0, y: 0 }}
                     end={{ x: 1, y: 0 }}
                     style={tw`px-3 py-1 rounded-full shadow-sm`}
                   >
                     <Text style={tw`text-white text-xs font-bold uppercase tracking-wide`}>
                       {product.isOutOfStock ? 'Out of Stock' : 'In Stock'}
                     </Text>
                   </LinearGradient>
                 </TouchableOpacity>
                 <Text style={tw`text-xs text-gray-400 font-medium mt-1 uppercase`}>Stock</Text>
               </View> */}
            </View>
          </Animated.View>

          {/* Description */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={tw`px-4 mb-4`}>
            <View style={tw`bg-white p-6 rounded-3xl shadow-sm`}>
              <View style={tw`flex-row items-center mb-4`}>
                <View style={tw`w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-3`}>
                  <MaterialCommunityIcons name="text-box-outline" size={22} color="#2563EB" />
                </View>
                <Text style={tw`text-lg font-bold text-gray-900`}>Description</Text>
              </View>

              {product.shortDescription && (
                <Text style={tw`text-gray-900 font-medium text-base mb-3 leading-relaxed`}>{product.shortDescription}</Text>
              )}

              <Text style={tw`text-gray-600 leading-7 text-base`}>
                {product.longDescription || "No detailed description available for this product."}
              </Text>
            </View>
           </Animated.View>

           {/* Availability */}
           <Animated.View entering={FadeInDown.delay(250).duration(500)} style={tw`px-4 mb-4`}>
             <View style={tw`bg-white p-6 rounded-3xl shadow-sm`}>
               <View style={tw`flex-row items-center mb-4`}>
                 <View style={tw`w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-3`}>
                   <MaterialIcons name="inventory" size={22} color="#2563EB" />
                 </View>
                 <Text style={tw`text-lg font-bold text-gray-900`}>Availability</Text>
               </View>

               <Text style={tw`text-gray-600 mb-4`}>
                 This product is currently {product.isOutOfStock ? 'out of stock' : 'in stock'}.
               </Text>

               <TouchableOpacity
                 onPress={() => {
                   toggleOutOfStock.mutate({ id: productId }, {
                     onSuccess: () => {
                       Alert.alert('Success', 'Stock status updated');
                       refetch();
                     },
                     onError: (err) => Alert.alert('Error', err.message)
                   });
                 }}
                 activeOpacity={0.8}
                 style={tw`bg-gray-100 px-4 py-2 rounded-full border border-gray-200 self-start`}
               >
                 <Text style={tw`text-gray-700 font-bold text-sm`}>
                   Mark as {product.isOutOfStock ? 'In Stock' : 'Out of Stock'}
                 </Text>
               </TouchableOpacity>
             </View>
           </Animated.View>

           {/* Special Deals */}
          {product.deals && product.deals.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300).duration(500)} style={tw`px-4 mb-4`}>
              <LinearGradient
                colors={['#FFFBEB', '#FEF3C7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={tw`p-6 rounded-3xl shadow-sm border border-amber-100`}
              >
                <View style={tw`flex-row items-center mb-4`}>
                  <View style={tw`w-10 h-10 bg-amber-100 rounded-full items-center justify-center mr-3`}>
                    <MaterialIcons name="local-offer" size={22} color="#D97706" />
                  </View>
                  <Text style={tw`text-lg font-bold text-amber-900`}>Special Deals</Text>
                </View>

                {product.deals.map((deal, index) => (
                  <View key={index} style={tw`flex-row justify-between items-center bg-white/60 p-4 rounded-2xl mb-2 border border-amber-200/50`}>
                    <View>
                      <Text style={tw`text-amber-900 font-bold text-lg`}>Buy {deal.quantity}</Text>
                      <Text style={tw`text-amber-700 text-xs font-medium`}>Valid until {new Date(deal.validTill).toLocaleDateString()}</Text>
                    </View>
                    <View style={tw`items-end`}>
                      <Text style={tw`text-2xl font-black text-amber-600`}>₹{deal.price}</Text>
                      <Text style={tw`text-amber-700 text-xs font-medium`}>Total Price</Text>
                    </View>
                  </View>
                ))}
              </LinearGradient>
            </Animated.View>
          )}

          {/* Reviews Section */}
          <Animated.View entering={FadeInDown.delay(400).duration(500)} style={tw`px-4 mb-8`}>
            <View style={tw`bg-white p-6 rounded-3xl shadow-sm`}>
              <View style={tw`flex-row justify-between items-center mb-6`}>
                <View style={tw`flex-row items-center`}>
                  <View style={tw`w-10 h-10 bg-purple-50 rounded-full items-center justify-center mr-3`}>
                    <MaterialIcons name="rate-review" size={22} color="#7C3AED" />
                  </View>
                  <Text style={tw`text-lg font-bold text-gray-900`}>Reviews</Text>
                </View>
                <View style={tw`bg-gray-100 px-3 py-1 rounded-full`}>
                  <Text style={tw`text-xs font-bold text-gray-600`}>{reviewsData?.reviews.length || 0} Total</Text>
                </View>
              </View>

              {reviewsData && reviewsData.reviews.length > 0 ? (
                reviewsData.reviews.map((review, idx) => (
                  <View key={review.id} style={tw`mb-6 last:mb-0`}>
                    <View style={tw`flex-row items-start`}>
                      <View style={tw`flex-1 bg-gray-50 p-4 rounded-2xl`}>
                        <View style={tw`flex-row justify-between items-start mb-2`}>
                          <Text style={tw`font-bold text-gray-900 text-base`}>{review.userName}</Text>
                          <View style={tw`flex-row`}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <MaterialIcons
                                key={star}
                                name={star <= review.ratings ? 'star' : 'star-border'}
                                size={14}
                                color="#F59E0B"
                              />
                            ))}
                          </View>
                        </View>

                        <Text style={tw`text-gray-700 leading-relaxed mb-3`}>{review.reviewBody}</Text>

                        {review.signedImageUrls && review.signedImageUrls.length > 0 && (
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-3`}>
                            {review.signedImageUrls.map((url, index) => (
                              <Image key={index} source={{ uri: url }} style={tw`w-16 h-16 rounded-lg mr-2 bg-gray-200`} />
                            ))}
                          </ScrollView>
                        )}

                        {/* Admin Response Section */}
                        {review.adminResponse ? (
                          <View style={tw`mt-3 pt-3 border-t border-gray-200`}>
                            <View style={tw`flex-row items-center mb-1`}>
                              <MaterialIcons name="verified-user" size={14} color="#2563EB" />
                              <Text style={tw`text-blue-700 font-bold text-xs ml-1`}>Admin Response</Text>
                            </View>
                            <Text style={tw`text-gray-600 text-sm leading-relaxed`}>{review.adminResponse}</Text>
                            {review.signedAdminImageUrls && review.signedAdminImageUrls.length > 0 && (
                              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mt-2`}>
                                {review.signedAdminImageUrls.map((url, index) => (
                                  <Image key={index} source={{ uri: url }} style={tw`w-12 h-12 rounded-lg mr-2 bg-white`} />
                                ))}
                              </ScrollView>
                            )}
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedReview(review);
                              setResponseDialogOpen(true);
                            }}
                            style={tw`mt-2 self-end px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm flex-row items-center`}
                          >
                            <MaterialIcons name="reply" size={16} color="#059669" />
                            <Text style={tw`text-gray-700 font-bold text-xs ml-1`}>Reply</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={tw`py-10 items-center justify-center opacity-50`}>
                  <MaterialIcons name="chat-bubble-outline" size={48} color="#9CA3AF" />
                  <Text style={tw`text-gray-400 mt-2 font-medium`}>No reviews yet</Text>
                </View>
              )}
            </View>
          </Animated.View>

        </View>
      </ScrollView>

      {/* Response Dialog */}
      <BottomDialog open={responseDialogOpen} onClose={() => setResponseDialogOpen(false)}>
        <View style={tw`p-6 max-h-[700px]`}>
          <View style={tw`flex-row justify-between items-center mb-6`}>
            <Text style={tw`text-2xl font-bold text-gray-900`}>Reply to Review</Text>
            <TouchableOpacity onPress={() => setResponseDialogOpen(false)} style={tw`p-2 bg-gray-100 rounded-full`}>
              <MaterialIcons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {selectedReview && (
            <View>
              <View style={tw`bg-gray-50 p-4 rounded-2xl mb-6 border border-gray-100`}>
                <View style={tw`flex-row items-center mb-2`}>
                  <MaterialIcons name="format-quote" size={20} color="#9CA3AF" />
                  <Text style={tw`text-xs font-bold text-gray-500 uppercase ml-1`}>Replying to {selectedReview.userName}</Text>
                </View>
                <Text style={tw`text-gray-700 italic text-base leading-relaxed pl-2 border-l-2 border-gray-300`} numberOfLines={3}>
                  {selectedReview.reviewBody}
                </Text>
              </View>
              <ReviewResponseForm
                reviewId={selectedReview.id}
                onClose={() => {
                  setResponseDialogOpen(false);
                  setSelectedReview(null);
                }}
              />
            </View>
          )}
        </View>
      </BottomDialog>
    </View>
  );
}