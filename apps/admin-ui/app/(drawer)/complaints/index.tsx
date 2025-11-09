import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { tw, ConfirmationDialog, MyText } from "common-ui";
import { usePagination } from "../../../hooks/usePagination";
import { AppContainer } from "common-ui";
import { trpc } from "@/src/trpc-client";

export default function Complaints() {
  const { currentPage, pageSize, PaginationComponent } = usePagination(5); // 5 complaints per page for testing
  const { data, isLoading, error, refetch } = trpc.admin.complaint.getAll.useQuery({
    page: currentPage,
    limit: pageSize,
  });
  const resolveComplaint = trpc.admin.complaint.resolve.useMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState<number | null>(null);

  const complaints = data?.complaints || [];
  const totalCount = data?.totalCount || 0;

  const handleMarkResolved = (id: number) => {
    setSelectedComplaintId(id);
    setDialogOpen(true);
  };

  const handleConfirmResolve = (response?: string) => {
    if (!selectedComplaintId) return;

    resolveComplaint.mutate(
      { id: String(selectedComplaintId), response },
      {
        onSuccess: () => {
          Alert.alert("Success", "Complaint marked as resolved");
          refetch();
          setDialogOpen(false);
          setSelectedComplaintId(null);
        },
        onError: (error: any) => {
          Alert.alert(
            "Error",
            error.message || "Failed to resolve complaint"
          );
          setDialogOpen(false);
          setSelectedComplaintId(null);
        },
      }
    );
  };

   if (isLoading) {
     return (
       <AppContainer>
         <View style={tw`flex-1 justify-center items-center`}>
           <MyText style={tw`text-gray-600`}>Loading complaints...</MyText>
         </View>
       </AppContainer>
     );
   }

   if (error) {
     return (
       <AppContainer>
         <View style={tw`flex-1 justify-center items-center`}>
           <MyText style={tw`text-red-600`}>Error loading complaints</MyText>
         </View>
       </AppContainer>
     );
   }

  return (
    <AppContainer>
      <FlatList
        data={complaints}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
           <View style={tw`bg-white p-4 mb-4 rounded-2xl shadow-lg`}>
             <MyText style={tw`text-lg font-bold mb-2 text-gray-800`}>Complaint #{item.id}</MyText>
             <MyText style={tw`text-base mb-2 text-gray-700`}>{item.text}</MyText>
             <View style={tw`flex-row items-center mb-2`}>
               <TouchableOpacity
                 onPress={() =>
                   Alert.alert("User Page", "User page coming soon")
                 }
               >
                 <MyText style={tw`text-sm text-blue-600 underline`}>
                   {item.userName}
                 </MyText>
               </TouchableOpacity>
               <MyText style={tw`text-sm text-gray-600 mx-2`}>|</MyText>
               {item.orderId && (
                 <TouchableOpacity
                   onPress={() =>
                     Alert.alert("Order Page", "Order page coming soon")
                   }
                 >
                   <MyText style={tw`text-sm text-blue-600 underline`}>
                     Order #{item.orderId}
                   </MyText>
                 </TouchableOpacity>
               )}
             </View>
             <MyText
               style={tw`text-sm ${
                 item.status === "resolved" ? "text-green-600" : "text-red-600"
               }`}
             >
               Status: {item.status}
             </MyText>
             {item.status === "pending" && (
               <TouchableOpacity
                 onPress={() => handleMarkResolved(item.id)}
                 style={tw`mt-2 bg-blue-500 p-3 rounded-lg shadow-md`}
               >
                 <MyText style={tw`text-white text-center font-semibold`}>Mark as Resolved</MyText>
               </TouchableOpacity>
             )}
          </View>
        )}
         ListEmptyComponent={
           <View style={tw`flex-1 justify-center items-center py-10`}>
             <MyText style={tw`text-gray-500 text-center`}>No complaints found</MyText>
           </View>
         }
      />
      <PaginationComponent totalCount={totalCount} />
      <ConfirmationDialog
        open={dialogOpen}
        positiveAction={handleConfirmResolve}
        commentNeeded={true}
        negativeAction={() => {
          setDialogOpen(false);
          setSelectedComplaintId(null);
        }}
        title="Mark as Resolved"
        message="Add admin notes for this resolution:"
        confirmText="Resolve"
        cancelText="Cancel"
      />
    </AppContainer>
  );
}
