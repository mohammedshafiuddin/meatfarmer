import React, { useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { View, ScrollView } from "react-native";
import { tw , MyTextInput , MyButton , CustomDropdown , MyText , MultiSelectDropdown , ImageUploader } from "common-ui";
import { useNavigation } from "@react-navigation/native";
import {
  useGetHospitalById,
  useUpdateHospital,
  useCreateHospital,
  useGetPotentialHospitalAdmins,
  useHospitalAdminDashboard,
} from "@/api-hooks/hospital.api";
import { useGetPotentialDoctorEmployees } from "@/api-hooks/hospital-admin.api";
import { ErrorToast, SuccessToast } from "@/services/toaster";
import AppContainer from "@/components/app-container";
import { Chip } from "react-native-paper";
import { useIsAdmin, useRoles } from "./context/roles-context";
import { useIsHospitalAdmin } from "./context/auth-context";
import usePickImage from "@/hooks/usePickImage";

const HospitalSchema = Yup.object().shape({
  name: Yup.string().required("Hospital name is required"),
  description: Yup.string(),
  address: Yup.string().required("Hospital address is required"),
});

export const initialHospitalValues = {
  name: "",
  description: "",
  address: "",
  id: undefined as number | undefined,
  adminId: undefined as number | undefined,
};

interface HospitalFormProps {
  initialValues?: typeof initialHospitalValues;
  submitButtonText?: string;
}

function HospitalForm({
  initialValues = initialHospitalValues,
  submitButtonText = "Submit",
}: Omit<HospitalFormProps, "onSubmit" | "onCancel">) {
  const navigation = useNavigation();
  const {
    data: hospitalDetails,
    isLoading,
    refetch: refetchHospitalInfo,
  } = useGetHospitalById(initialValues.id);
  

  const isAdmin = useIsAdmin();

  const { mutate: updateHospitalDetails } = useUpdateHospital();
  const { mutate: createHospital } = useCreateHospital();
  const { data: potentialAdmins, isLoading: isLoadingAdmins } =
    useGetPotentialHospitalAdmins();
  const { data: potentialDoctors, isLoading: potentialDoctorsLoading } =
    useGetPotentialDoctorEmployees();
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    refetch: refetchDashboardData,
  } = useHospitalAdminDashboard(initialValues.id);
  
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<
    (string | number)[]
  >([]);
  const [doctorsToRemove, setDoctorsToRemove] = useState<number[]>([]);
  const [selectedAdminIds, setSelectedAdminIds] = useState<(string | number)[]>(
    []
  );
  const [adminsToRemove, setAdminsToRemove] = useState<number[]>([]);
  const [newImages, setNewImages] = useState<{ uri: string, mimeType: string, fileName:string }[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]); // Track images to remove
  const [existingImages, setExistingImages] = useState<{ uri?: string }[]>([]); // Track existing images

  
  // Load existing images when editing a hospital
  React.useEffect(() => {
    // This will run both on initial load and after refetch
    if (hospitalDetails?.hospitalImages && hospitalDetails.hospitalImages.length > 0) {
      // Convert existing image URLs to the format expected by the image uploader
      const initialExistingImages = hospitalDetails.hospitalImages.map((url: string) => ({
        uri: url
      }));
      setExistingImages(initialExistingImages);
      // When refetching after a successful update, newImages should be cleared
      // because they are now part of the existing images from the backend
    } else {
      setExistingImages([]);
    }
  }, [hospitalDetails?.hospitalImages]);

  const handleImageUpload = usePickImage({
    setFile: (images) => {
        setNewImages((prev) => [...prev, ...images])
    },
    multiple: true,
  });

  const handleRemoveExistingImage = (url: string) => {
    // Add to the removal list and remove from existing images
    setImagesToRemove(prev => [...prev, url]);
    setExistingImages(prev => prev.filter(img => img.uri !== url));
  };

  const handleRemoveImage = (uri: string) => {
    setNewImages((prev) => prev.filter((image) => image.uri !== uri));
  };

  const handleSubmit = async (
    values: typeof initialHospitalValues,
    { setSubmitting }: any
  ) => {
    try {
      
      const payload = {
        ...values,
        adminsToAdd: selectedAdminIds,
        adminsToRemove,
        doctorsToAdd: selectedDoctorIds.map(Number),
        doctorsToRemove,
        imagesToRemove: JSON.stringify(imagesToRemove), // Add images to remove to the payload
      };

      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'imagesToRemove') {
            // For the imagesToRemove array, we need to stringify it
            formData.append(key, value as string);
          } else {
            formData.append(key, value as string);
          }
        }
      });

      // Append new images to the form data
      newImages.forEach((image, index) => {
        if (image.uri) {
          formData.append("hospitalImages", {
            uri: image.uri,
            name: `hospital_${index}_${image.fileName}.jpg`,
            type: image.mimeType || "image/*", // Allow any image type
          } as any);
        }
      });


      if (initialValues.id) {
        
        formData.append("id", initialValues.id.toString());
        updateHospitalDetails(
           formData,
          {
            onSuccess: () => {
              SuccessToast("Hospital updated successfully");
              setSelectedAdminIds([]);
              setSelectedDoctorIds([]);
              setAdminsToRemove([]);
              setDoctorsToRemove([]);
              setNewImages([]); // Clear new images after successful update
              setImagesToRemove([]); // Clear images to remove after successful update
              // Note: existingImages will be updated automatically when refetchHospitalInfo completes
              // and triggers the useEffect that depends on hospitalDetails.hospitalImages
              refetchHospitalInfo();
              refetchDashboardData();
            },
            onError: (error) => {
              ErrorToast(error.message || "Failed to update hospital");
            },
          }
        );
      } else {
        console.log('calling create api')
        createHospital(formData, {
          onSuccess: () => {
            SuccessToast("Hospital added successfully");
          },
          onError: (error) => {
            ErrorToast(error.message || "Failed to add hospital");
          },
        });
      }
    } catch (error) {
      console.error("Error submitting hospital:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleMarkDoctorForRemoval = (doctorId: number) => {
    setDoctorsToRemove((prev) => [...prev, doctorId]);
  };

  const handleUnmarkDoctorForRemoval = (doctorId: number) => {
    setDoctorsToRemove((prev) => prev.filter((id) => id !== doctorId));
  };

  const isDoctorMarkedForRemoval = (doctorId: number) => {
    return doctorsToRemove.includes(doctorId);
  };

  const handleMarkAdminForRemoval = (adminId: number) => {
    setAdminsToRemove((prev) => [...prev, adminId]);
  };

  const handleUnmarkAdminForRemoval = (adminId: number) => {
    setAdminsToRemove((prev) => prev.filter((id) => id !== adminId));
  };

  const isAdminMarkedForRemoval = (adminId: number) => {
    return adminsToRemove.includes(adminId);
  };

  if (isLoading || dashboardLoading) {
    return <MyText>Loading...</MyText>;
  }

  if (potentialDoctorsLoading) {
    return <MyText>Loading potential doctors...</MyText>;
  }

  if (isLoadingAdmins) {
    return <MyText>Loading potential admins...</MyText>;
  }

  const mergedInitialValues = {
    ...initialHospitalValues,
    ...hospitalDetails,
  };

  const adminOptions = potentialAdmins
    ? potentialAdmins.map((admin) => ({
        label: `${admin.name} (${admin.username}) - ${admin.roles?.join(", ")}`,
        value: admin.id,
      }))
    : [];

  return (
    <View style={tw`p-4`}>
      <Formik
        initialValues={mergedInitialValues}
        validationSchema={HospitalSchema}
        onSubmit={handleSubmit}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
          isSubmitting,
        }) => (
          <View>
            <View style={tw`mb-4`}>
              <MyTextInput
                topLabel="Hospital Name"
                placeholder="Enter hospital name"
                value={values.name}
                onChangeText={handleChange("name")}
                onBlur={handleBlur("name")}
                style={tw`mb-2`}
              />
              {touched.name && errors.name && (
                <MyText style={tw`text-red-500 text-xs mt-1`}>
                  {errors.name}
                </MyText>
              )}
            </View>

            <View style={tw`mb-4`}>
              <MyTextInput
                topLabel="Description"
                placeholder="Enter hospital description"
                value={values.description}
                onChangeText={handleChange("description")}
                onBlur={handleBlur("description")}
                multiline
                numberOfLines={4}
                style={tw`mb-2`}
              />
              {touched.description && errors.description && (
                <MyText style={tw`text-red-500 text-xs mt-1`}>
                  {errors.description}
                </MyText>
              )}
            </View>

            <View style={tw`mb-4`}>
              <MyTextInput
                topLabel="Address"
                placeholder="Enter hospital address"
                value={values.address}
                onChangeText={handleChange("address")}
                onBlur={handleBlur("address")}
                multiline
                numberOfLines={3}
                style={tw`mb-2`}
              />
              {touched.address && errors.address && (
                <MyText style={tw`text-red-500 text-xs mt-1`}>
                  {errors.address}
                </MyText>
              )}
            </View>

            {/* Image Upload Section */}
            <View style={tw`mb-4`}>
              <MyText style={tw`mb-2`}>Hospital Images</MyText>
              <ImageUploader
                images={newImages}
                existingImageUrls={existingImages.map(img => img.uri || '')}
                onAddImage={handleImageUpload}
                onRemoveImage={handleRemoveImage}
                onRemoveExistingImage={handleRemoveExistingImage}
              />
            </View>

            {isAdmin && (
              <View style={tw`mt-6 mb-4`}>
                <MyText style={tw`text-lg font-semibold mb-2`}>
                  Hospital Admins
                </MyText>

                {/* Display current admins as chips */}
                <View style={tw`mb-4`}>
                  <MyText style={tw`mb-2 text-sm text-gray-600`}>
                    Current Admins:
                  </MyText>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={tw`flex-row flex-wrap`}
                    style={tw`max-h-20`}
                  >
                    {dashboardData?.admins &&
                    dashboardData.admins.length > 0 ? (
                      dashboardData.admins.map((admin) => {
                        const isMarkedForRemoval = isAdminMarkedForRemoval(
                          admin.id
                        );
                        return (
                          <Chip
                            key={admin.id}
                            onClose={() => {
                              if (isMarkedForRemoval) {
                                handleUnmarkAdminForRemoval(admin.id);
                              } else {
                                handleMarkAdminForRemoval(admin.id);
                              }
                            }}
                            style={[
                              tw`m-1`,
                              isMarkedForRemoval ? tw`bg-red-100` : null,
                            ]}
                            mode="outlined"
                            closeIcon={
                              isMarkedForRemoval
                                ? "close-circle-outline"
                                : "close"
                            }
                          >
                            {admin.name}
                            {isMarkedForRemoval ? " (will be removed)" : ""}
                          </Chip>
                        );
                      })
                    ) : (
                      <MyText style={tw`text-gray-500 italic`}>
                        No admins assigned to this hospital
                      </MyText>
                    )}
                  </ScrollView>
                  {adminsToRemove.length > 0 && (
                    <MyText style={tw`text-xs text-red-500 mt-1`}>
                      {adminsToRemove.length} admin(s) marked for removal.
                      Changes will apply when you update the hospital.
                    </MyText>
                  )}
                </View>

                {/* MultiSelect for adding new admins */}
                <View style={tw`mb-4`}>
                  <MyText style={tw`mb-1 text-sm font-medium`}>
                    Add Admins
                  </MyText>
                  <MultiSelectDropdown
                    data={
                      potentialAdmins?.map((admin) => ({
                        label: admin.name,
                        value: admin.id.toString(),
                      })) || []
                    }
                    value={selectedAdminIds.map((id) => id.toString())}
                    onChange={(values) =>
                      setSelectedAdminIds(values.map((v) => Number(v)))
                    }
                    placeholder="Select admins to add..."
                    search
                    maxHeight={300}
                    inputSearchStyle={tw`h-10 p-2`}
                  />

                  {selectedAdminIds.length > 0 && (
                    <MyText style={tw`text-xs text-blue-500 mt-1`}>
                      {selectedAdminIds.length} admin(s) selected to add.
                      Changes will apply when you update the hospital.
                    </MyText>
                  )}
                </View>
              </View>
            )}

            {/* Hospital Doctors Section */}
            <View style={tw`mt-6 mb-4`}>
              <MyText style={tw`text-lg font-semibold mb-2`}>
                Hospital Doctors
              </MyText>

              {/* Display current doctors as chips */}
              <View style={tw`mb-4`}>
                <MyText style={tw`mb-2 text-sm text-gray-600`}>
                  Current Doctors:
                </MyText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={tw`flex-row flex-wrap`}
                  style={tw`max-h-20`}
                >
                  {dashboardData?.doctors &&
                  dashboardData.doctors.length > 0 ? (
                    dashboardData.doctors.map((doctor) => {
                      const isMarkedForRemoval = isDoctorMarkedForRemoval(
                        doctor.id
                      );
                      return (
                        <Chip
                          key={doctor.id}
                          onClose={() => {
                            if (isMarkedForRemoval) {
                              handleUnmarkDoctorForRemoval(doctor.id);
                            } else {
                              handleMarkDoctorForRemoval(doctor.id);
                            }
                          }}
                          style={[
                            tw`m-1`,
                            isMarkedForRemoval ? tw`bg-red-100` : null,
                          ]}
                          mode="outlined"
                          closeIcon={
                            isMarkedForRemoval
                              ? "close-circle-outline"
                              : "close"
                          }
                        >
                          {doctor.name}
                          {isMarkedForRemoval ? " (will be removed)" : ""}
                        </Chip>
                      );
                    })
                  ) : (
                    <MyText style={tw`text-gray-500 italic`}>
                      No doctors assigned to this hospital
                    </MyText>
                  )}
                </ScrollView>
                {doctorsToRemove.length > 0 && (
                  <MyText style={tw`text-xs text-red-500 mt-1`}>
                    {doctorsToRemove.length} doctor(s) marked for removal.
                    Changes will apply when you update the hospital.
                  </MyText>
                )}
              </View>

              {/* MultiSelect for adding new doctors */}
              <View style={tw`mb-4`}>
                <MyText style={tw`mb-1 text-sm font-medium`}>
                  Add Doctors
                </MyText>
                <MultiSelectDropdown
                  data={
                    potentialDoctors?.map((doctor) => ({
                      label: doctor.name,
                      value: doctor.id.toString(),
                    })) || []
                  }
                  value={selectedDoctorIds.map((id) => id.toString())}
                  onChange={(values) =>
                    setSelectedDoctorIds(values.map((v) => Number(v)))
                  }
                  placeholder="Select doctors to add..."
                  search
                  maxHeight={300}
                  inputSearchStyle={tw`h-10 p-2`}
                />

                {selectedDoctorIds.length > 0 && (
                  <MyText style={tw`text-xs text-blue-500 mt-1`}>
                    {selectedDoctorIds.length} doctor(s) selected to add.
                    Changes will apply when you update the hospital.
                  </MyText>
                )}
              </View>
            </View>

            <View style={tw`flex-row justify-between mt-6`}>
              <MyButton
                mode="outlined"
                textContent="Cancel"
                onPress={handleCancel}
                style={tw`flex-1 mr-2`}
              />

              <MyButton
                mode="contained"
                textContent={isSubmitting ? "Submitting..." : submitButtonText}
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

export default HospitalForm;
