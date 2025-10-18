import { MyText , MyButton , MyTextInput , CustomDropdown , MultiSelectDropdown , tw , ROLE_NAMES, BUSINESS_ROLE_OPTIONS } from "common-ui";
import { Image, TouchableOpacity ,
  View,
  Alert,
} from "react-native";
import usePickImage from "@/hooks/usePickImage";
import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { Formik } from "formik";
import * as Yup from "yup";
import {
  useCreateBusinessUser,
  useUpdateBusinessUser,
} from "@/api-hooks/user.api";
import { useSpecializations } from "@/api-hooks/common.api";
import { useGetHospitals } from "@/api-hooks/hospital.api";

// Define validation schema using Yup
const getBusinessUserSchema = (isEditing: boolean) => {
  // Base schema for both create and edit
  const baseSchema = {
    name: Yup.string().required("Name is required"),
    role: Yup.string()
      .required("Role is required")
      .oneOf(Object.values(ROLE_NAMES), "Invalid role"),
    specializations: Yup.string().when("role", {
      is: ROLE_NAMES.DOCTOR,
      then: (schema) =>
        schema
          .required("At least one specialization is required for doctors")
          .test(
            "has-specializations",
            "At least one specialization is required",
            (value) => Boolean(value && value.length > 0)
          ),
      otherwise: (schema) => schema.optional(),
    }),
    consultationFee: Yup.number().when("role", {
      is: ROLE_NAMES.DOCTOR,
      then: (schema) =>
        schema
          .required("Consultation fee is required")
          .min(0, "Consultation fee must be a positive number"),
      otherwise: (schema) => schema.optional(),
    }),
    dailyTokenCount: Yup.number().when("role", {
      is: ROLE_NAMES.DOCTOR,
      then: (schema) =>
        schema
          .required("Daily token count is required")
          .integer("Token count must be a whole number")
          .min(0, "Token count must be a positive number"),
      otherwise: (schema) => schema.optional(),
    }),
    yearsOfExperience: Yup.number().when("role", {
      is: ROLE_NAMES.DOCTOR,
      then: (schema) =>
        schema
          .nullable()
          .integer("Years must be a whole number")
          .min(0, "Years must be a positive number"),
      otherwise: (schema) => schema.optional(),
    }),
    description: Yup.string().when("role", {
      is: ROLE_NAMES.DOCTOR,
      then: (schema) => schema.nullable().max(500, "Description must be less than 500 characters"),
      otherwise: (schema) => schema.optional(),
    }),
    hospitalId: Yup.number().optional(),
    // hospitalId: Yup.number().when("role", {
    //   is: ROLE_NAMES.DOCTOR,
    //   then: (schema) => schema.optional(),
    //   otherwise: (schema) => schema.optional(),
    // }),
  };

  // Add validation fields for creation only
  if (!isEditing) {
    return Yup.object().shape({
      ...baseSchema,
      username: Yup.string()
        .required("Username is required")
        .min(4, "Username must be at least 4 characters"),
      password: Yup.string().required("Password is required"),
      confirmPassword: Yup.string()
        .required("Confirm password is required")
        .oneOf([Yup.ref("password")], "Passwords must match"),
    });
  }

  // For editing, password fields are optional
  return Yup.object().shape({
    ...baseSchema,
    username: Yup.string()
      .required("Username is required")
      .min(4, "Username must be at least 4 characters"),
    password: Yup.string().optional(),
    confirmPassword: Yup.string().when("password", {
      is: (val: string) => val && val.length > 0,
      then: (schema) =>
        schema
          .required("Confirm password is required")
          .oneOf([Yup.ref("password")], "Passwords must match"),
      otherwise: (schema) => schema.optional(),
    }),
  });
};

// Initial form values
const getInitialValues = (userData?: any) => {
  return {
    name: userData?.name || "",
    username: userData?.username || "",
    password: "",
    confirmPassword: "",
    role: userData?.role || ROLE_NAMES.HOSPITAL_ADMIN,
    specializations: userData?.specializationIds
      ? userData.specializationIds.join(",")
      : "",
    consultationFee: userData?.consultationFee || "",
    dailyTokenCount: userData?.dailyTokenCount || "",
    yearsOfExperience: userData?.yearsOfExperience || "",
    description: userData?.description || "",
    hospitalId: userData?.hospitalId || "",
  };
};

// Using the business role options from constants
const roles = BUSINESS_ROLE_OPTIONS;

interface FixedValues {
  role?: typeof ROLE_NAMES.DOCTOR; // Only allowing doctor role as specified
  hospitalId?: number;
}

interface AddBusinessUserFormProps {
  onSuccess?: () => void;
  userData?: any;
  isEditing?: boolean;
  fixedValues?: FixedValues;
}

function AddBusinessUserForm({
  onSuccess,
  userData,
  isEditing = false,
  fixedValues,
}: AddBusinessUserFormProps) {
  const router = useRouter();
  const createBusinessUserMutation = useCreateBusinessUser();
  const updateBusinessUserMutation = userData?.id
    ? useUpdateBusinessUser(userData.id)
    : null;
  const { data: specializationsList, isLoading: isLoadingSpecializations } =
    useSpecializations();
  const { data: hospitals, isLoading: isLoadingHospitals } = useGetHospitals();

  const hospitalOptions =
    hospitals?.hospitals.map((hospital) => ({
      label: hospital.name,
      value: hospital.id,
    })) || [];

  const [profilePic, setProfilePic] = React.useState<{ uri?: string } | null>(
    null
  );
  const handleProfilePicUpload = usePickImage({
    setFile: setProfilePic,
    multiple: false,
  });

  const initialValues = {
    ...getInitialValues(userData),
    ...(fixedValues?.role ? { role: fixedValues.role } : {}),
    ...(fixedValues?.hospitalId ? { hospitalId: fixedValues.hospitalId.toString() } : {}),
  };
  const validationSchema = getBusinessUserSchema(isEditing);

  const handleSubmit = async (
    values: typeof initialValues,
    { setSubmitting }: any
  ) => {
    try {
      if (isEditing && userData?.id) {
        // Update existing user
        const updatePayload = {
          name: values.name,
          ...(values.password ? { password: values.password } : {}),
          ...(values.role === ROLE_NAMES.DOCTOR && values.specializations
            ? {
                specializationIds: values.specializations
                  .split(",")
                  .map((id: string) => parseInt(id)),
                consultationFee: parseFloat(values.consultationFee),
                dailyTokenCount: parseInt(values.dailyTokenCount),
                yearsOfExperience: values.yearsOfExperience ? parseInt(values.yearsOfExperience) : null,
                description: values.description,
                hospitalId: values.hospitalId,
              }
            : {}),
        };

        const formData = new FormData();
        Object.entries(updatePayload).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value as string);
          }
        });

        // Attach profilePic property if present
        if (profilePic) {
          formData.append("profilePic", {
            uri: profilePic.uri,
            name: "profile.jpg",
            type: "image/jpeg",
          } as any);
        }

        updateBusinessUserMutation!.mutate(formData, {
          onSuccess: () => {
            Alert.alert("Success", "Business user updated successfully!", [
              {
                text: "OK",
                onPress: () => {
                  if (onSuccess) {
                    onSuccess();
                  } else {
                    router.push("/(drawer)/admin-panel/manage-business-users");
                  }
                },
              },
            ]);
          },
        });
      } else {
        // Create new user
        const userPayload = {
          name: values.name,
          username: values.username,
          password: values.password,
          role: values.role,
          hospitalId: Number(values.hospitalId),
          ...(values.role === ROLE_NAMES.DOCTOR && values.specializations
            ? {
                specializationIds: values.specializations
                  .split(",")
                  .map((id: string) => parseInt(id)),
                consultationFee: parseFloat(values.consultationFee),
                dailyTokenCount: parseInt(values.dailyTokenCount),
                yearsOfExperience: values.yearsOfExperience ? parseInt(values.yearsOfExperience) : null,
                description: values.description,
              }
            : {}),
        };

        const formData = new FormData();
        Object.entries(userPayload).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value as string);
          }
        });

        // Attach profilePic property if present
        if (profilePic && profilePic.uri) {
          formData.append("profilePic", {
            uri: profilePic.uri,
            name: "profile.jpg",
            type: "image/jpeg",
          } as any);
        }

        await createBusinessUserMutation.mutateAsync(formData, {
          onSuccess: () => {
            Alert.alert("Success", "Business user added successfully!", [
              {
                text: "OK",
                onPress: () => {
                  if (onSuccess) {
                    onSuccess();
                  } else {
                    router.push("/(drawer)/admin-panel/manage-business-users");
                  }
                },
              },
            ]);
          },
        });
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message ||
          `Failed to ${
            isEditing ? "update" : "add"
          } business user. Please try again.`,
        [{ text: "OK" }]
      );
    } finally {
      setSubmitting(false);
    }
  };


  return (

        <View style={tw`flex-col gap-4 pb-10`}>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
              isSubmitting,
              setFieldValue,
            }) => (
              <View>
                {/* Profile Pic Field */}
                <TouchableOpacity
                  onPress={handleProfilePicUpload}
                  activeOpacity={0.7}
                  style={{ alignSelf: "center", marginBottom: 8 }}
                >
                  {profilePic && profilePic.uri ? (
                    <Image
                      source={{ uri: profilePic.uri }}
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        marginBottom: 8,
                        backgroundColor: "#eee",
                      }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: "#eee",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 8,
                      }}
                    >
                      <MyText>Pick</MyText>
                    </View>
                  )}
                </TouchableOpacity>
                <View style={tw`mb-4`}>
                  <MyTextInput
                    topLabel="Full Name"
                    placeholder="Enter user's full name"
                    value={values.name}
                    onChangeText={handleChange("name")}
                    onBlur={handleBlur("name")}
                    style={tw`mb-2`}
                  />
                  {touched.name && errors.name && (
                    <MyText style={tw`text-red-500 text-xs mt-1`}>
                      {String(errors.name)}
                    </MyText>
                  )}
                </View>

                <View style={tw`mb-4`}>
                  <MyTextInput
                    topLabel="Username"
                    placeholder="Enter username"
                    value={values.username}
                    onChangeText={handleChange("username")}
                    onBlur={handleBlur("username")}
                    style={tw`mb-2`}
                    autoCapitalize="none"
                    editable={!isEditing} // Username can't be edited
                  />
                  {touched.username && errors.username && (
                    <MyText style={tw`text-red-500 text-xs mt-1`}>
                      {String(errors.username)}
                    </MyText>
                  )}
                </View>

                <View style={tw`mb-4`}>
                  <MyTextInput
                    topLabel={
                      isEditing
                        ? "New Password (leave blank to keep current)"
                        : "Password"
                    }
                    placeholder={
                      isEditing ? "Enter new password" : "Enter password"
                    }
                    value={values.password}
                    onChangeText={handleChange("password")}
                    onBlur={handleBlur("password")}
                    style={tw`mb-2`}
                    secureTextEntry
                  />
                  {touched.password && errors.password && (
                    <MyText style={tw`text-red-500 text-xs mt-1`}>
                      {String(errors.password)}
                    </MyText>
                  )}
                </View>

                <View style={tw`mb-4`}>
                  <MyTextInput
                    topLabel={
                      isEditing ? "Confirm New Password" : "Confirm Password"
                    }
                    placeholder="Confirm password"
                    value={values.confirmPassword}
                    onChangeText={handleChange("confirmPassword")}
                    onBlur={handleBlur("confirmPassword")}
                    style={tw`mb-2`}
                    secureTextEntry
                  />
                  {touched.confirmPassword && errors.confirmPassword && (
                    <MyText style={tw`text-red-500 text-xs mt-1`}>
                      {String(errors.confirmPassword)}
                    </MyText>
                  )}
                </View>

                {!fixedValues?.role && ( // Only show role dropdown if not fixed
                  <View style={tw`mb-4`}>
                    <CustomDropdown
                      label="Role"
                      value={values.role}
                      options={roles}
                      onValueChange={(value: string | number) => {
                        setFieldValue("role", value);
                        if (value !== ROLE_NAMES.DOCTOR) {
                          setFieldValue("specializations", "");
                          setFieldValue("hospitalId", ""); // Reset hospitalId when role is not doctor
                        }
                      }}
                      error={touched.role && !!errors.role}
                      style={tw`relative`}
                      disabled={isEditing} // Role can't be changed when editing
                    />
                    {touched.role && errors.role && (
                      <MyText style={tw`text-red-500 text-xs mt-1`}>
                        {String(errors.role)}
                      </MyText>
                    )}
                  </View>
                )}

                {values.role === ROLE_NAMES.DOCTOR && (
                  <View style={tw`mb-4`}>
                    <MultiSelectDropdown
                      placeholder="Select Specializations"
                      value={
                        values.specializations
                          ? values.specializations.split(",")
                          : []
                      }
                      data={
                        specializationsList?.map((spec) => ({
                          label: spec.name,
                          value: spec.id.toString(),
                        })) || []
                      }
                      onChange={(vals: string[]) =>
                        setFieldValue(
                          "specializations",
                          Array.isArray(vals) ? vals.join(",") : ""
                        )
                      }
                      style={tw`relative`}
                      disabled={isLoadingSpecializations}
                      dropdownStyle={{
                        borderWidth: 2,
                        borderColor:
                          touched.specializations && errors.specializations
                            ? "#ef4444"
                            : "#d1d5db",
                      }}
                    />
                    {touched.specializations && errors.specializations && (
                      <MyText style={tw`text-red-500 text-xs mt-1`}>
                        {String(errors.specializations)}
                      </MyText>
                    )}
                    {isLoadingSpecializations && (
                      <MyText style={tw`text-gray-500 text-xs mt-1`}>
                        Loading specializations...
                      </MyText>
                    )}

                    <View style={tw`mt-4`}>
                      <MyTextInput
                        topLabel="Consultation Fee"
                        placeholder="Enter consultation fee"
                        value={values.consultationFee.toString()}
                        onChangeText={handleChange("consultationFee")}
                        onBlur={handleBlur("consultationFee")}
                        style={tw`mb-2`}
                        keyboardType="numeric"
                      />
                      {touched.consultationFee && errors.consultationFee && (
                        <MyText style={tw`text-red-500 text-xs mt-1`}>
                          {String(errors.consultationFee)}
                        </MyText>
                      )}
                    </View>

                    <View style={tw`mt-4`}>
                      <MyTextInput
                        topLabel="Daily Token Count"
                        placeholder="Enter daily token count"
                        value={values.dailyTokenCount.toString()}
                        onChangeText={handleChange("dailyTokenCount")}
                        onBlur={handleBlur("dailyTokenCount")}
                        style={tw`mb-2`}
                        keyboardType="numeric"
                      />
                      {touched.dailyTokenCount && errors.dailyTokenCount && (
                        <MyText style={tw`text-red-500 text-xs mt-1`}>
                          {String(errors.dailyTokenCount)}
                        </MyText>
                      )}
                    </View>

                    <View style={tw`mt-4`}>
                      <MyTextInput
                        topLabel="Years of Experience"
                        placeholder="Enter years of experience"
                        value={values.yearsOfExperience.toString()}
                        onChangeText={handleChange("yearsOfExperience")}
                        onBlur={handleBlur("yearsOfExperience")}
                        style={tw`mb-2`}
                        keyboardType="numeric"
                      />
                      {touched.yearsOfExperience && errors.yearsOfExperience && (
                        <MyText style={tw`text-red-500 text-xs mt-1`}>
                          {String(errors.yearsOfExperience)}
                        </MyText>
                      )}
                    </View>

                    <View style={tw`mt-4`}>
                      <MyTextInput
                        topLabel="Description"
                        placeholder="Enter description"
                        value={values.description}
                        onChangeText={handleChange("description")}
                        onBlur={handleBlur("description")}
                        style={tw`mb-2`}
                        multiline={true}
                        numberOfLines={4}
                      />
                      {touched.description && errors.description && (
                        <MyText style={tw`text-red-500 text-xs mt-1`}>
                          {String(errors.description)}
                        </MyText>
                      )}
                    </View>
                  </View>
                )}

                {(!fixedValues?.hospitalId && (values.role === ROLE_NAMES.DOCTOR ||
                values.role === ROLE_NAMES.HOSPITAL_ADMIN)) ? (
                  <View style={tw`mt-4`}>
                    <CustomDropdown
                      label="Select Hospital"
                      value={values.hospitalId}
                      options={hospitalOptions}
                      onValueChange={(value: string | number) =>
                        setFieldValue("hospitalId", value)
                      }
                      error={touched.hospitalId && !!errors.hospitalId}
                      style={tw`relative`}
                      disabled={isLoadingHospitals}
                    />
                    {touched.hospitalId && errors.hospitalId && (
                      <MyText style={tw`text-red-500 text-xs mt-1`}>
                        {String(errors.hospitalId)}
                      </MyText>
                    )}
                    {isLoadingHospitals && (
                      <MyText style={tw`text-gray-500 text-xs mt-1`}>
                        Loading hospitals...
                      </MyText>
                    )}
                  </View>
                ) : null}

                <View style={tw`flex-row justify-between mt-6`}>
                  <MyButton
                    mode="outlined"
                    textContent="Cancel"
                    onPress={() => router.back()}
                    style={tw`flex-1 mr-2`}
                  />

                  <MyButton
                    mode="contained"
                    textContent={
                      isSubmitting
                        ? isEditing
                          ? "Updating..."
                          : "Adding..."
                        : isEditing
                        ? "Update User"
                        : "Add User"
                    }
                    onPress={handleSubmit as any}
                    disabled={isSubmitting}
                    style={tw`flex-1 ml-2`}
                  />
                </View>
              </View>
            )}
          </Formik>
        </View>
  );
}

export default AddBusinessUserForm;
