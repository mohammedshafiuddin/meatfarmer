import React from 'react'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { View, Text, TouchableOpacity } from 'react-native'
import { MyTextInput, BottomDropdown, tw } from 'common-ui'
import { trpc } from '@/src/trpc-client'

interface AddressPlaceFormProps {
  onSubmit: (values: { placeName: string; zoneId: number | null }) => void
  onClose: () => void
}

const AddressPlaceForm: React.FC<AddressPlaceFormProps> = ({ onSubmit, onClose }) => {
  const { data: zones } = trpc.admin.address.getZones.useQuery()

  const validationSchema = Yup.object({
    placeName: Yup.string().required('Place name is required'),
    zoneId: Yup.number().optional(),
  })

  const zoneOptions = zones?.map(z => ({ label: z.zoneName, value: z.id })) || []

  return (
    <View style={tw`p-4`}>
      <Text style={tw`text-lg font-semibold mb-4`}>Add Place</Text>
      <Formik
        initialValues={{ placeName: '', zoneId: null as number | null }}
        validationSchema={validationSchema}
        onSubmit={(values) => {
          onSubmit(values)
          onClose()
        }}
      >
        {({ handleChange, setFieldValue, handleSubmit, values, errors, touched }) => (
          <View>
            <MyTextInput
              label="Place Name"
              value={values.placeName}
              onChangeText={handleChange('placeName')}
              error={!!(touched.placeName && errors.placeName)}
            />
            <BottomDropdown
              label="Zone (Optional)"
              value={values.zoneId as any}
              options={zoneOptions}
              onValueChange={(value) => setFieldValue('zoneId', value as number | undefined)}
              placeholder="Select Zone"
            />
            <View style={tw`flex-row justify-between mt-4`}>
              <TouchableOpacity style={tw`bg-gray2 px-4 py-2 rounded`} onPress={onClose}>
                <Text style={tw`text-gray-900`}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={tw`bg-blue1 px-4 py-2 rounded`} onPress={() => handleSubmit()}>
                <Text style={tw`text-white`}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Formik>
    </View>
  )
}

export default AddressPlaceForm