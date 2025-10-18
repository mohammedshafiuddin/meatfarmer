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
    <View style={styles.container}>
      <TouchableOpacity onPress={showDatepicker} style={styles.fullWidth}>
        {showLabel && <MyText>{placeholder}</MyText>}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderColor: theme.colors.gray1,
            borderWidth: 0.5,
            borderRadius: 4,
            paddingVertical: 8,
            paddingHorizontal: 8,
            justifyContent: "space-between",
          }}
        >
          <Text style={[styles.dateText, { opacity: value ? 1 : 0.5 }]}>
            {value?.toLocaleDateString() || placeholder}
          </Text>
          <MaterialCommunityIcons
            name="calendar"
            size={24}
            color={theme.colors.gray1}
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
          <View style={styles.modalOverlay}>
            <View style={styles.pickerContainer}>
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

export default DatePicker;

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "flex-start",
    padding: 0,
    marginBottom: 16,
    width: "100%",
  },
  fullWidth: {
    width: "100%",
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