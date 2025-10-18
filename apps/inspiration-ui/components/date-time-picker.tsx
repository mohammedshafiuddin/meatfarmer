// import { useTheme } from "@/hooks/theme-context";
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
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MyText from "./text";
import { useTheme } from "common-ui";

interface Props {
  value: Date | null;
  setValue: (date: Date | null) => void;
  showLabels?: boolean; // Optional prop to control label visibility
}

type Mode = "date" | "time" | "datetime";

function DateTimePickerMod(props: Props) {
  const { value, setValue, showLabels = true } = props;
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
    <View style={styles.container}>
      <View
        style={{ width: "100%", flexDirection: "row", alignItems: "stretch" }}
      >
        <TouchableOpacity
          onPress={showDatepicker}
          style={{
            width: "50%",
          }}
        >
          {showLabels && <MyText>Select Date</MyText>}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderColor: theme.colors.gray1,
              borderWidth: 0.5,
              borderRadius: 4,
              paddingVertical: 4,
              paddingHorizontal: 4,
              justifyContent: "space-between",
            }}
          >
            <Text style={[styles.dateText, { opacity: value ? 1 : 0.5 }]}>{value?.toLocaleDateString() || "Select Date"}</Text>
            <MaterialCommunityIcons
              name="calendar"
              size={24}
              color={theme.colors.gray1}
              style={{}}
            />
          </View>
        </TouchableOpacity>
        <View style={styles.spacerHorizontalSmall} />
        <TouchableOpacity
          onPress={showTimepicker}
          style={{
            width: "50%",
          }}
        >
          {showLabels && <MyText>Select Time</MyText>}
          <View
            style={{
              borderColor: theme.colors.gray1,
              borderWidth: 0.5,
              borderRadius: 4,
              paddingVertical: 4,
              paddingHorizontal: 4,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 4,
            }}
          >
            <Text style={[styles.timeText, { opacity: value ? 1 : 0.5 }]}>
              {value?.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }) || "Select Time"}
            </Text>
            <MaterialCommunityIcons
              name="clock"
              size={24}
              color={theme.colors.gray1}
              style={{}}
            />
          </View>
        </TouchableOpacity>
      </View>
      {/* Conditional rendering for iOS, as it uses the declarative API */}
      {show && Platform.OS === "ios" && (
        <Modal
          transparent
          animationType="fade"
          visible={show}
          onRequestClose={() => setShow(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.pickerContainer}>
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
                style={styles.doneButton}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

export default DateTimePickerMod;

const styles = StyleSheet.create({
  container: {
    // flex: 1, // Remove flex to avoid taking up extra space
    justifyContent: "center",
    alignItems: "flex-start",
    padding: 0, // Reduce padding for compactness
    marginBottom: 16, // Add margin for spacing in forms
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  iconRowSingleLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
  },
  iconNoBg: {
    backgroundColor: "transparent",
    borderRadius: 0,
    padding: 0,
    elevation: 0,
  },
  spacerHorizontal: {
    width: 30,
  },
  spacerHorizontalSmall: {
    width: 8,
  },
  spacer: {
    height: 20, // Add some space between buttons
  },
  selectedText: {
    marginTop: 30,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  timeTextContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  timeText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    marginLeft: 2,
  },
  dateText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    marginLeft: 2,
    marginRight: 2,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  pickerContainer: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  doneButton: {
    marginTop: 10,
    backgroundColor: "#007bff",
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
  },
  doneButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
