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

import { useTheme, tw } from "common-ui";
import MyText from './text';

interface Props {
  value: Date | null;
  setValue: (date: Date | null) => void;
  showLabels?: boolean; // Optional prop to control label visibility
  timeOnly?: boolean; // Optional prop to show only time picker
}

type Mode = "date" | "time" | "datetime";

function DateTimePickerMod(props: Props) {
  const { value, setValue, showLabels = true, timeOnly = false } = props;
  const [show, setShow] = useState<boolean>(false);
  const [mode, setMode] = useState<Mode>("date");

  const onChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || value;
    if (Platform.OS === "ios") setShow(false);
    setValue(currentDate);
  };

  const showMode = (currentMode: Mode) => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: value || new Date(),
        onChange: onChange,
        mode: currentMode,
        is24Hour: true,
        display: "default",
      } as AndroidNativeProps);
    } else {
      setShow(true);
      setMode(currentMode);
    }
  };
  const showDatepicker = () => {
    showMode("date");
  };

  const showTimepicker = () => {
    showMode("time");
  };
  const { theme } = useTheme();

  return (
    <View style={tw`justify-center items-start p-0 w-full mb-4`}>
      {timeOnly ? (
        <TouchableOpacity onPress={showTimepicker} style={tw`w-full`}>
          {showLabels && <MyText style={tw`text-xs`}>Select Time</MyText>}
          <View style={tw`flex-row items-center border border-gray5 rounded py-1 px-1 justify-between gap-1`}>
            <Text style={[tw`text-sm font-medium text-gray-800 ml-0.5 mr-0.5`, { opacity: value ? 1 : 0.5 }]}>
              {value?.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }) || "Select Time"}
            </Text>
            <MaterialCommunityIcons
              name="clock"
              size={24}
              color={theme.colors.gray5}
            />
          </View>
        </TouchableOpacity>
      ) : (
        <View style={tw`w-full flex-row items-stretch`}>
          <TouchableOpacity
            onPress={showDatepicker}
            style={tw`w-1/2`}
          >
            {showLabels && <MyText style={tw`text-xs`}>Select Date</MyText>}
            <View style={tw`flex-row items-center border border-gray5 rounded py-1 px-1 justify-between`}>
              <Text style={[tw`text-sm font-medium text-gray-800 ml-0.5 mr-0.5`, { opacity: value ? 1 : 0.5 }]}>{value?.toLocaleDateString() || "Select Date"}</Text>
              <MaterialCommunityIcons
                name="calendar"
                size={24}
                color={theme.colors.gray5}
              />
            </View>
          </TouchableOpacity>
          <View style={tw`w-2`} />
          <TouchableOpacity
            onPress={showTimepicker}
            style={tw`w-1/2`}
          >
            {showLabels && <MyText style={tw`text-xs`}>Select Time</MyText>}
            <View style={tw`flex-row items-center border border-gray5 rounded py-1 px-1 justify-between gap-1`}>
              <Text style={[tw`text-sm font-medium text-gray-800 ml-0.5 mr-0.5`, { opacity: value ? 1 : 0.5 }]}>
                {value?.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }) || "Select Time"}
              </Text>
              <MaterialCommunityIcons
                name="clock"
                size={24}
                color={theme.colors.gray5}
              />
            </View>
          </TouchableOpacity>
        </View>
      )}
      {/* Conditional rendering for iOS, as it uses the declarative API */}
      {show && Platform.OS === "ios" && (
        <Modal
          transparent
          animationType="fade"
          visible={show}
          onRequestClose={() => setShow(false)}
        >
          <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
            <View style={[tw`w-4/5 bg-white rounded-xl p-5`, { elevation: 5 }]}>
              <DateTimePicker
                testID="dateTimePicker"
                value={value || new Date()}
                mode={mode}
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

export default DateTimePickerMod;


