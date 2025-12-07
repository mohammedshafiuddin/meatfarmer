import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Dimensions, StatusBar, Platform, TextInput, FlatList, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ImageCarousel, tw, BottomDialog, useManualRefresh, useMarkDataFetchers, LoadingDialog, ImageUploader } from 'common-ui';
import usePickImage from 'common-ui/src/components/use-pick-image';
import { theme } from 'common-ui/src/theme';
import dayjs from 'dayjs';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { trpc, trpcClient } from '@/src/trpc-client';

const { width: screenWidth } = Dimensions.get("window");
const carouselWidth = screenWidth;
const carouselHeight = carouselWidth * 0.8;

const extractKeyFromUrl = (url: string): string => {
  const u = new URL(url);
  const rawKey = u.pathname.replace(/^\/+/, "");
  return decodeURIComponent(rawKey);
};

export default function ProductDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [showAllSlots, setShowAllSlots] = useState(false);
  const [isLoadingDialogOpen, setIsLoadingDialogOpen] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [reviewsOffset, setReviewsOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const { data: productDetail, isLoading, error, refetch } = trpc.user.product.getProductDetails.useQuery({ id: id.toString() });
  const addToCart = trpc.user.cart.addToCart.useMutation();

  
  useManualRefresh(() => {
    refetch();
  });

  useMarkDataFetchers(() => {
    refetch();
  });

  const handleAddToCart = (productId: number) => {
    setIsLoadingDialogOpen(true);
    addToCart.mutate({ productId, quantity: 1 }, {
      onSuccess: () => {
        Alert.alert('Success', 'Item added to cart!');
      },
      onError: (error: any) => {
        Alert.alert('Error', error.message || 'Failed to add item to cart');
      },
      onSettled: () => {
        setIsLoadingDialogOpen(false);
      },
    });
  };

  const handleBuyNow = (productId: number) => {
    setIsLoadingDialogOpen(true);
    addToCart.mutate({ productId, quantity: 1 }, {
      onSuccess: () => {
        router.push(`/my-cart?select=${productId}`);
      },
      onError: (error: any) => {
        Alert.alert('Error', error.message || 'Failed to add item to cart');
      },
      onSettled: () => {
        setIsLoadingDialogOpen(false);
      },
    });
  };

     const discountPercentage = productDetail?.marketPrice
     ? Math.round(((Number(productDetail.marketPrice) - Number(productDetail.price)) / Number(productDetail.marketPrice)) * 100)
     : 0;

   const loadReviews = async (reset = false) => {
     if (reviewsLoading || (!hasMore && !reset)) return;
     setReviewsLoading(true);
     try {
       const { reviews: newReviews, hasMore: newHasMore } = await trpcClient.user.product.getProductReviews.query({
         productId: Number(id),
         limit: 10,
         offset: reset ? 0 : reviewsOffset,
       });
       setReviews(reset ? newReviews : [...reviews, ...newReviews]);
       setHasMore(newHasMore);
       setReviewsOffset(reset ? 10 : reviewsOffset + 10);
     } catch (error) {
       console.error('Error loading reviews:', error);
     } finally {
       setReviewsLoading(false);
     }
   };

    const onRefresh = async () => {
      setRefreshing(true);
      await refetch(); // Refetch product details
      await loadReviews(true); // Reset and reload reviews
      setRefreshing(false);
    };

    React.useEffect(() => {
      if (productDetail?.id) {
        loadReviews(true);
      }
    }, [productDetail?.id]);

   if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
        <Text style={tw`text-gray-500 font-medium`}>Loading product details...</Text>
      </View>
    );
  }

  if (error || !productDetail) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text style={tw`text-gray-900 text-lg font-bold mt-4`}>Oops!</Text>
        <Text style={tw`text-gray-500 mt-2`}>Product not found or error loading</Text>
      </View>
    );
  }


  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <StatusBar barStyle="dark-content" />
      {/* <CustomHeader /> */}

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`pb-32`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.pink1]}
            tintColor={theme.colors.pink1}
          />
        }
      >
        {/* Image Carousel */}
        <View style={tw`bg-white shadow-sm mb-4`}>
          <ImageCarousel
            urls={productDetail.images}
            imageWidth={carouselWidth}
            imageHeight={carouselHeight}
            showPaginationDots={true}
          />
        </View>

        {/* Product Info */}
        <View style={tw`px-4 mb-4`}>
          <View style={tw`bg-white p-5 rounded-2xl shadow-sm border border-gray-100`}>
            <View style={tw`flex-row justify-between items-start mb-2`}>
              <Text style={tw`text-2xl font-bold text-gray-900 flex-1 mr-2`}>{productDetail.name}</Text>
              {productDetail.isOutOfStock && (
                <View style={tw`bg-red-100 px-3 py-1 rounded-full`}>
                  <Text style={tw`text-red-700 text-xs font-bold`}>Out of Stock</Text>
                </View>
              )}
            </View>

            <Text style={tw`text-base text-gray-500 mb-4 leading-6`}>{productDetail.shortDescription}</Text>

            <View style={tw`flex-row items-end`}>
              <Text style={tw`text-3xl font-bold text-gray-900`}>₹{productDetail.price}</Text>
              <Text style={tw`text-gray-500 text-lg mb-1 ml-1`}>/ {productDetail.unit}</Text>
              {productDetail.marketPrice && (
                <View style={tw`ml-3 mb-1 flex-row items-center`}>
                  <Text style={tw`text-gray-400 text-base line-through mr-2`}>₹{productDetail.marketPrice}</Text>
                  <View style={tw`bg-green-100 px-2 py-0.5 rounded`}>
                    <Text style={tw`text-green-700 text-xs font-bold`}>{discountPercentage}% OFF</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Delivery Slots */}
        <View style={tw`px-4 mb-4`}>
          <View style={tw`bg-white p-5 rounded-2xl shadow-sm border border-gray-100`}>
            <View style={tw`flex-row items-center mb-4`}>
              <View style={tw`w-8 h-8 bg-blue-50 rounded-full items-center justify-center mr-3`}>
                <MaterialIcons name="schedule" size={18} color="#3B82F6" />
              </View>
              <Text style={tw`text-lg font-bold text-gray-900`}>Available Slots</Text>
            </View>

            {productDetail.deliverySlots.length === 0 ? (
              <Text style={tw`text-gray-400 italic`}>No delivery slots available currently</Text>
            ) : (
              <>
                {productDetail.deliverySlots.slice(0, 2).map((slot, index) => (
                  <View key={index} style={tw`flex-row items-start mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100`}>
                    <MaterialIcons name="local-shipping" size={20} color="#3B82F6" style={tw`mt-0.5`} />
                    <View style={tw`ml-3 flex-1`}>
                      <Text style={tw`text-gray-900 font-bold text-sm`}>
                        {dayjs(slot.deliveryTime).format('ddd, DD MMM • h:mm A')}
                      </Text>
                      <Text style={tw`text-xs text-gray-500 mt-1`}>
                        Freeze by: {dayjs(slot.freezeTime).format('h:mm A')}
                      </Text>
                    </View>
                  </View>
                ))}
                {productDetail.deliverySlots.length > 2 && (
                  <TouchableOpacity
                    onPress={() => setShowAllSlots(true)}
                    style={tw`items-center py-2`}
                  >
                    <Text style={tw`text-pink1 font-bold text-sm`}>View All {productDetail.deliverySlots.length} Slots</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>



        {/* Description */}
        <View style={tw`px-4 mb-4`}>
          <View style={tw`bg-white p-5 rounded-2xl shadow-sm border border-gray-100`}>
            <Text style={tw`text-lg font-bold text-gray-900 mb-3`}>About the Product</Text>
            {!productDetail.longDescription ? (
              <Text style={tw`text-gray-400 italic`}>
                No detailed description available.
              </Text>
            ) : (
              <Text style={tw`text-gray-600 leading-6`}>{productDetail.longDescription}</Text>
            )}

            {productDetail.store && (
              <View style={tw`mt-6 pt-4 border-t border-gray-100 flex-row items-center`}>
                <View style={tw`w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3`}>
                  <FontAwesome5 name="store" size={16} color="#4B5563" />
                </View>
                <View>
                  <Text style={tw`text-xs text-gray-500 uppercase font-bold`}>Sourced From</Text>
                  <Text style={tw`text-gray-900 font-bold`}>{productDetail.store.name}</Text>
                </View>
              </View>
            )}
           </View>
           </View>

          {/* Package Deals */}
        {productDetail.specialPackageDeals && productDetail.specialPackageDeals.length > 0 && (
          <View style={tw`px-4 mb-4`}>
            <View style={tw`bg-white p-5 rounded-2xl shadow-sm border border-gray-100`}>
              <View style={tw`flex-row items-center mb-4`}>
                <View style={tw`w-8 h-8 bg-amber-50 rounded-full items-center justify-center mr-3`}>
                  <MaterialIcons name="stars" size={18} color="#F59E0B" />
                </View>
                <Text style={tw`text-lg font-bold text-gray-900`}>Bulk Savings</Text>
              </View>

              {productDetail.specialPackageDeals.map((deal, index) => (
                <View key={index} style={tw`flex-row justify-between items-center p-3 bg-amber-50 rounded-xl border border-amber-100 mb-2`}>
                  <Text style={tw`text-amber-900 font-medium`}>Buy {deal.quantity} {productDetail.unit}</Text>
                  <Text style={tw`text-amber-900 font-bold text-lg`}>₹{deal.price}</Text>
                </View>
              ))}
             </View>
           </View>
         )}

         {/* Review Form */}
         <ReviewForm productId={productDetail.id} />

         {/* Reviews */}
         <View style={tw`px-4 mb-4`}>
           <View style={tw`bg-white p-5 rounded-2xl shadow-sm border border-gray-100`}>
             <Text style={tw`text-lg font-bold text-gray-900 mb-3`}>Customer Reviews</Text>
             <FlatList
               data={reviews}
               keyExtractor={(item) => item.id.toString()}
               renderItem={({ item }) => (
                 <View style={tw`mb-4 pb-4 border-b border-gray-100`}>
                   <View style={tw`flex-row items-center mb-2`}>
                     <Text style={tw`font-bold text-gray-900`}>{item.userName}</Text>
                     <View style={tw`flex-row ml-2`}>
                       {[1, 2, 3, 4, 5].map((star) => (
                         <MaterialIcons
                           key={star}
                           name={star <= item.ratings ? 'star' : 'star-border'}
                           size={16}
                           color="#F59E0B"
                         />
                       ))}
                     </View>
                   </View>
                   <Text style={tw`text-gray-600 mb-2`}>{item.reviewBody}</Text>
                    {item.signedImageUrls && item.signedImageUrls.length > 0 && (
                      <View style={{ alignSelf: 'flex-start' }}>
                        <ImageCarousel
                          urls={item.signedImageUrls}
                          imageWidth={100}
                          imageHeight={100}
                          showPaginationDots={false}
                        />
                      </View>
                    )}
                   <Text style={tw`text-xs text-gray-500`}>{dayjs(item.reviewTime).format('MMM DD, YYYY')}</Text>
                 </View>
               )}
               onEndReached={() => loadReviews()}
               onEndReachedThreshold={0.5}
               ListEmptyComponent={<Text style={tw`text-gray-400 italic`}>No reviews yet. Be the first!</Text>}
               ListFooterComponent={reviewsLoading ? <Text style={tw`text-center text-gray-500`}>Loading more reviews...</Text> : null}
               scrollEnabled={false}
             />
           </View>
         </View>
       </ScrollView>

      {/* Bottom Action Bar */}
      <View style={tw`absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-${Platform.OS === 'ios' ? '8' : '4'} shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex-row gap-3`}>
        <TouchableOpacity
          style={[tw`flex-1 py-3.5 rounded-xl items-center border`, {
            borderColor: productDetail.isOutOfStock ? '#9ca3af' : theme.colors.pink1,
            backgroundColor: 'white'
          }]}
          onPress={() => !productDetail.isOutOfStock && handleAddToCart(productDetail.id)}
          disabled={productDetail.isOutOfStock}
        >
          <Text style={[tw`font-bold text-base`, { color: productDetail.isOutOfStock ? '#9ca3af' : theme.colors.pink1 }]}>
            {productDetail.isOutOfStock ? 'Unavailable' : 'Add to Cart'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[tw`flex-1 py-3.5 rounded-xl items-center shadow-md`, {
            backgroundColor: (productDetail.isOutOfStock || productDetail.deliverySlots.length === 0) ? '#9ca3af' : theme.colors.pink1
          }]}
          onPress={() => !(productDetail.isOutOfStock || productDetail.deliverySlots.length === 0) && handleBuyNow(productDetail.id)}
          disabled={productDetail.isOutOfStock || productDetail.deliverySlots.length === 0}
        >
          <Text style={tw`text-white text-base font-bold`}>
            {productDetail.isOutOfStock ? 'Out of Stock' :
              productDetail.deliverySlots.length === 0 ? 'No Slots' :
                'Buy Now'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* All Slots Dialog */}
      <BottomDialog open={showAllSlots} onClose={() => setShowAllSlots(false)}>
        <View style={tw`p-6 max-h-[500px]`}>
          <View style={tw`flex-row items-center mb-6`}>
            <View style={tw`w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-3`}>
              <MaterialIcons name="schedule" size={20} color="#3B82F6" />
            </View>
            <Text style={tw`text-xl font-bold text-gray-900`}>All Delivery Slots</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {productDetail.deliverySlots.map((slot, index) => (
              <View key={index} style={tw`flex-row items-start mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100`}>
                <MaterialIcons name="local-shipping" size={20} color="#3B82F6" style={tw`mt-0.5`} />
                <View style={tw`ml-3 flex-1`}>
                  <Text style={tw`text-gray-900 font-bold text-base`}>
                    {dayjs(slot.deliveryTime).format('ddd, DD MMM • h:mm A')}
                  </Text>
                  <Text style={tw`text-sm text-gray-500 mt-1`}>
                    Freeze by: {dayjs(slot.freezeTime).format('h:mm A')}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={tw`mt-4 bg-gray-900 py-3.5 rounded-xl items-center`}
            onPress={() => setShowAllSlots(false)}
          >
            <Text style={tw`text-white font-bold`}>Close</Text>
          </TouchableOpacity>
        </View>
      </BottomDialog>

       <LoadingDialog open={isLoadingDialogOpen} message="Processing..." />
     </View>
   );
}

interface ReviewFormProps {
  productId: number;
}

const ReviewForm = ({ productId }: ReviewFormProps) => {
  const [reviewBody, setReviewBody] = useState('');
  const [ratings, setRatings] = useState(0);
  const [selectedImages, setSelectedImages] = useState<{ blob: Blob; mimeType: string }[]>([]);
  const [displayImages, setDisplayImages] = useState<{ uri?: string }[]>([]);


  const createReview = trpc.user.product.createReview.useMutation();
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

  const handleSubmit = async () => {
    if (!reviewBody.trim() || ratings === 0) {
      Alert.alert('Error', 'Please provide a review and rating.');
      return;
    }

    try {
      // Generate upload URLs
      const mimeTypes = selectedImages.map(s => s.mimeType);
      const { uploadUrls: generatedUrls } = await generateUploadUrls.mutateAsync({
        contextString: 'review',
        mimeTypes,
      });
      const keys = generatedUrls.map(extractKeyFromUrl);
            
      // Upload images
      for (let i = 0; i < generatedUrls.length; i++) {
        const uploadUrl = generatedUrls[i];
        const key = keys[i];
        const { blob, mimeType } = selectedImages[i];


        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: blob,
          headers: {
            'Content-Type': mimeType,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed with status ${uploadResponse.status}`);
        }
      }

      // Submit review with image URLs
      await createReview.mutateAsync({
        productId,
        reviewBody,
        ratings,
        imageUrls: keys,
        uploadUrls: generatedUrls,
      });

      Alert.alert('Success', 'Review submitted!');
      // Reset form
      setReviewBody('');
      setRatings(0);
      setSelectedImages([]);
      setDisplayImages([]);
    } catch (error) {
      console.log({error: JSON.stringify(error)})
      
      Alert.alert('Error', 'Failed to submit review.');
    }
  };

  return (
    <View style={tw`bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mx-4 mb-4`}>
      <Text style={tw`text-lg font-bold text-gray-900 mb-4`}>Write a Review</Text>

      {/* Rating */}
      <View style={tw`mb-4`}>
        <Text style={tw`text-gray-700 mb-2`}>Rating:</Text>
        <View style={tw`flex-row`}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRatings(star)}>
              <MaterialIcons
                name={star <= ratings ? 'star' : 'star-border'}
                size={30}
                color={star <= ratings ? '#F59E0B' : '#D1D5DB'}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Review Text */}
      <TextInput
        style={tw`border border-gray-300 rounded-lg p-3 mb-4 h-24 text-gray-900`}
        placeholder="Write your review..."
        value={reviewBody}
        onChangeText={setReviewBody}
        multiline
      />

      {/* Images */}
      <ImageUploader
        images={displayImages}
        existingImageUrls={[]}
        onAddImage={handleImagePick}
        onRemoveImage={handleRemoveImage}
      />

      {/* Submit */}
      <TouchableOpacity
        style={tw`bg-pink1 py-3 rounded-lg items-center`}
        onPress={handleSubmit}
        disabled={createReview.isPending}
      >
        <Text style={tw`text-white font-bold`}>
          {createReview.isPending ? 'Submitting...' : 'Submit Review'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};