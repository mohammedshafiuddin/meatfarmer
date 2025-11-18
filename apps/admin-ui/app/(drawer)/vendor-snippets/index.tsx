import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { TabViewWrapper, AppContainer, MyText, tw, useManualRefresh, useMarkDataFetchers } from 'common-ui';
import { trpc, trpcClient } from '../../../src/trpc-client';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import VendorSnippetForm from '../../../components/VendorSnippetForm';
import SnippetOrdersView from '../../../components/SnippetOrdersView';
import { SnippetMenu } from '../../../components/SnippetMenu';

interface VendorSnippet {
  id: number;
  snippetCode: string;
  slotId: number;
  productIds: number[];
  validTill: string | null;
  createdAt: string;
  accessUrl: string;
  slot?: {
    id: number;
    deliveryTime: string;
    freezeTime: string;
    isActive: boolean;
    deliverySequence?: unknown;
  };
}

const SnippetItem = ({
  snippet,
  onEdit,
  onDelete,
  onViewOrders
}: {
  snippet: VendorSnippet;
  onEdit: (snippet: VendorSnippet) => void;
  onDelete: (id: number) => void;
  onViewOrders: (snippetCode: string) => void;
}) => {
  const isExpired = snippet.validTill && new Date(snippet.validTill) < new Date();

  return (
    <View style={tw`bg-white p-4 mb-2 rounded-2xl shadow-lg border ${isExpired ? 'border-red-200' : 'border-gray-100'}`}>
      <View style={tw`flex-row justify-between items-start mb-3`}>
        <View style={tw`flex-1`}>
          <MyText style={tw`font-bold text-gray-800 mb-1`}>{snippet.snippetCode}</MyText>
          <MyText style={tw`text-sm text-gray-600`}>
            Slot: {snippet.slot?.deliveryTime ? new Date(snippet.slot.deliveryTime).toLocaleDateString() : `ID: ${snippet.slotId}`}
          </MyText>
        </View>
        <SnippetMenu
          snippet={snippet}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewOrders={onViewOrders}
        />
      </View>

      <MyText style={tw`text-gray-700 mb-2`}>
        Products: {snippet.productIds.length} items
      </MyText>

      <View style={tw`flex-row justify-between items-center`}>
        <MyText style={tw`text-sm text-gray-500`}>
          Created: {new Date(snippet.createdAt).toLocaleDateString()}
        </MyText>
        {snippet.validTill && (
          <MyText style={tw`text-sm ${isExpired ? 'text-red-600' : 'text-green-600'}`}>
            Expires: {new Date(snippet.validTill).toLocaleDateString()}
          </MyText>
        )}
      </View>

      {isExpired && (
        <View style={tw`mt-2 p-2 bg-red-50 rounded-lg`}>
          <MyText style={tw`text-sm text-red-700`}>This snippet has expired</MyText>
        </View>
      )}
    </View>
  );
};

export default function VendorSnippets() {
  // const { data: snippets, isLoading, error, refetch } = useVendorSnippets();
  const { data: snippets, isLoading, error, refetch } = trpc.admin.vendorSnippets.getAll.useQuery();
  
  const createSnippet = trpc.admin.vendorSnippets.create.useMutation();
  const updateSnippet = trpc.admin.vendorSnippets.update.useMutation();
  const deleteSnippet = trpc.admin.vendorSnippets.delete.useMutation();
  // const createSnippet = useCreateVendorSnippet();
  // const updateSnippet = useUpdateVendorSnippet();
  // const deleteSnippet = useDeleteVendorSnippet();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<VendorSnippet | null>(null);
  const [showOrdersView, setShowOrdersView] = useState(false);
  const [ordersData, setOrdersData] = useState<any>(null);


  useManualRefresh(refetch);

  useMarkDataFetchers(() => {
    refetch();
  });

  const handleCreate = () => {
    setShowCreateForm(true);
    setEditingSnippet(null);
  };

  const handleEdit = (snippet: VendorSnippet) => {
    setEditingSnippet(snippet);
    setShowCreateForm(true);
  };

  const handleDelete = (id: number) => {
    deleteSnippet.mutate({ id }, {
      onSuccess: () => {
        refetch();
      }
    });
  };

  const handleViewOrders = async (snippetCode: string) => {
    try {
      const result = await trpcClient.admin.vendorSnippets.getOrdersBySnippet.query({ snippetCode });
      if (result.success) {
        setOrdersData({
          orders: result.data,
          snippetCode: snippetCode,
        });
        setShowOrdersView(true);
      } else {
        Alert.alert('Error', 'Failed to fetch orders');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch orders');
    }
  };

  if (isLoading) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center`}>
          <MyText style={tw`text-gray-600`}>Loading vendor snippets...</MyText>
        </View>
      </AppContainer>
    );
  }

  if (error) {
    return (
      <AppContainer>
        <View style={tw`flex-1 justify-center items-center`}>
          <MyText style={tw`text-red-600`}>Error loading snippets</MyText>
        </View>
      </AppContainer>
    );
  }

  if (showOrdersView && ordersData) {
    return (
      <SnippetOrdersView
        orders={ordersData.orders}
        snippetCode={ordersData.snippetCode}
        onClose={() => {
          setShowOrdersView(false);
          setOrdersData(null);
        }}
      />
    );
  }

  if (showCreateForm) {
    return (
      <VendorSnippetForm
        snippet={editingSnippet}
        onClose={() => {
          setShowCreateForm(false);
          setEditingSnippet(null);
        }}
        onSuccess={() => {
          setShowCreateForm(false);
          setEditingSnippet(null);
          refetch();
        }}
      />
    );
  }

  return (
    <AppContainer>
      <View style={tw`flex-1`}>
        <View style={tw`px-6 py-4 flex-row justify-between items-center`}>
          <MyText style={tw`text-2xl font-bold text-gray-800`}>Vendor Snippets</MyText>
          <TouchableOpacity
            onPress={handleCreate}
            style={tw`bg-blue-500 px-4 py-2 rounded-lg`}
          >
            <MyText style={tw`text-white font-semibold`}>Create Snippet</MyText>
          </TouchableOpacity>
        </View>
        <MyText style={tw`text-gray-600 mt-1 px-6`}>Manage vendor identifier snippets</MyText>

        <ScrollView style={tw`flex-1 px-6`} showsVerticalScrollIndicator={false}>
          {snippets && snippets.length === 0 ? (
            <View style={tw`flex-1 justify-center items-center py-12`}>
              <MaterialIcons name="code" size={64} color="#D1D5DB" />
              <MyText style={tw`text-gray-500 text-lg font-semibold mt-4`}>No snippets yet</MyText>
              <MyText style={tw`text-gray-400 text-center mt-2`}>Create your first vendor snippet to get started</MyText>
            </View>
          ) : (
            snippets?.map(snippet => (
              <SnippetItem
                key={snippet.id}
                snippet={snippet}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewOrders={handleViewOrders}
              />
            ))
          )}
        </ScrollView>
      </View>
    </AppContainer>
  );
}