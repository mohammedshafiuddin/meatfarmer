import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker, {
  AndroidNativeProps,
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MyText from "./text";
import { useTheme, tw } from "common-ui";

interface Props {
  value: Date | null;
  setValue: (date: Date | null) => void;
  showLabel?: boolean; // Optional prop to control label visibility
  placeholder?: string; // Optional custom placeholder
}

function DatePicker(props: Props) {
  const { value, setValue, showLabel = true, placeholder = "Select Date" } = props;
  const [show, setShow] = useState<boolean>(false);
  const { theme } = useTheme();

  const onChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || value;
    if (Platform.OS === "ios") setShow(false);
    setValue(currentDate);
  };

  const showDatepicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: value || new Date(),
        onChange: onChange,
        mode: "date",
        is24Hour: true,
        display: "default",
      } as AndroidNativeProps);
    } else {
      setShow(true);
    }
  };

  return (
    <View style={tw`justify-center items-start p-0  w-full`}>
      <TouchableOpacity onPress={showDatepicker} style={tw`w-full`}>
        {showLabel && <MyText style={tw`text-xs`}>{placeholder}</MyText>}
        <View
          style={[tw`flex-row items-center border border-gray5 rounded py-2 px-2 justify-between`]}
        >
          <Text style={[tw`text-sm font-medium text-gray-800 ml-1 mr-1`, { opacity: value ? 1 : 0.5 }]}>
            {value?.toLocaleDateString() || placeholder}
          </Text>
          <MaterialCommunityIcons
            name="calendar"
            size={24}
            color={theme.colors.gray5}
          />
        </View>
      </TouchableOpacity>
      
      {/* Conditional rendering for iOS, as it uses the declarative API */}
      {show && Platform.OS === "ios" && (
        <Modal
          transparent
          animationType="fade"
          visible={show}
          onRequestClose={() => setShow(false)}
        >
          <View style={[tw`flex-1 justify-center items-center`, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}>
            <View style={[tw`w-4/5 bg-white rounded-xl p-5`, { elevation: 5 }]}>
              <DateTimePicker
                testID="dateTimePicker"
                value={value || new Date()}
                mode="date"
                is24Hour={true}
                display="default"
                onChange={onChange}
              />
              <TouchableOpacity
                onPress={() => setShow(false)}
                style={tw`mt-2.5 bg-blue-500 rounded py-2.5 items-center`}
              >
                <Text style={tw`text-white font-bold`}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

export default DatePicker;