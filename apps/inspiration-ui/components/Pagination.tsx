import React from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { Picker } from "@react-native-picker/picker";
import tw from "twrnc";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CustomDropdown, MyText } from "common-ui";

type PaginationModel = {
  currentPage: number;
  pageSize: number;
};

type Props = {
  totalRecords: number;
  paginationModel: PaginationModel;
  setPaginationModel: (m: PaginationModel) => void;
  pageSizeOptions?: number[];
  primaryColor?: string;
  inactiveColor?: string;
  containerTw?: any;
  chevTw?: any;
  pickerTw?: any;
};

export default function Pagination({
  totalRecords,
  paginationModel,
  setPaginationModel,
  pageSizeOptions = [10, 20, 50, 100],
  primaryColor = "#2f66d6",
  inactiveColor = "#868e96",
  containerTw,
  chevTw,
  pickerTw,
}: Props) {
  const { currentPage, pageSize } = paginationModel;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  function goToPage(p: number) {
    const next = Math.max(1, Math.min(p, totalPages));
    if (next !== currentPage)
      setPaginationModel({ ...paginationModel, currentPage: next });
  }

  function changePageSize(nextSize: number) {
    setPaginationModel({ currentPage: 1, pageSize: nextSize });
  }

  // Build page options for the page-picker dropdown
  const pageOptions = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <View style={tw`w-full flex justify-end`}>
      <View
        style={
          containerTw ??
          tw`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700`
        }
      >
        <View style={tw`flex-row items-center justify-end`}>
          {/* Go to first page */}
          <TouchableOpacity
            onPress={() => goToPage(1)}
            disabled={currentPage === 1}
            style={chevTw ?? tw` items-center justify-center mx-2 rounded-lg`}
            accessibilityLabel="First page"
          >
            <MaterialCommunityIcons
              name="chevron-double-left"
              size={22}
              color={currentPage === 1 ? inactiveColor : primaryColor}
            />
          </TouchableOpacity>

          {/* Previous */}
          <TouchableOpacity
            onPress={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            style={chevTw ?? tw` items-center justify-center mx-2 rounded-lg`}
            accessibilityLabel="Previous page"
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={22}
              color={currentPage === 1 ? inactiveColor : primaryColor}
            />
          </TouchableOpacity>

          {/* Current Page Picker */}
          <View style={tw`mx-2 flex-row gap-2 items-center`}>
            <MyText>Page</MyText>
            <View style={tw``}>
              <CustomDropdown
                label="Current Page"
                value={currentPage}
                onValueChange={(v) => goToPage(Number(v))}
                options={pageOptions.map((p) => ({
                  label: `${p}`,
                  value: p,
                }))}
                disabled={pageOptions.length <= 1}
              />
            </View>
            <MyText>{`of ${totalPages}`}</MyText>
          </View>

          {/* Next */}
          <TouchableOpacity
            onPress={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={chevTw ?? tw` items-center justify-center mx-2 rounded-lg`}
            accessibilityLabel="Next page"
          >
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color={currentPage === totalPages ? inactiveColor : primaryColor}
            />
          </TouchableOpacity>

          {/* Go to last page */}
          <TouchableOpacity
            onPress={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            style={chevTw ?? tw`items-center justify-center mx-2 rounded-lg`}
            accessibilityLabel="Last page"
          >
            <MaterialCommunityIcons
              name="chevron-double-right"
              size={22}
              color={currentPage === totalPages ? inactiveColor : primaryColor}
            />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={tw`mt-3 flex-row items-center justify-between ml-auto`}>

          <View style={pickerTw ?? tw`flex-row items-center ml-2`}>
            <View style={tw`overflow-hidden`}>
              <CustomDropdown
                label="no"
                value={pageSize}
                onValueChange={(v) => changePageSize(Number(v))}
                options={pageSizeOptions.map((opt) => ({
                  label: `${opt}`,
                  value: opt,
                }))}
                disabled={pageSizeOptions.length <= 1}
              />
            </View>
            <Text style={tw`mr-2 text-sm text-gray-700 dark:text-gray-300`}>
              rows per page
            </Text>
          </View>
        </View>

        {/* NOTE: If totalPages is very large, rendering a Picker with all pages may be unwieldy. If you expect 1000s of pages, ask me and I can replace the Picker with a searchable modal or an input + go button. */}
      </View>
    </View>
  );
}
