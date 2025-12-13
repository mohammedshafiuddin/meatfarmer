import React from 'react'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { View, Text, TouchableOpacity } from 'react-native'
import { MyTextInput, tw } from 'common-ui'

interface AddressZoneFormProps {
  onSubmit: (values: { zoneName: string }) => void
  onClose: () => void
}

const AddressZoneForm: React.FC<AddressZoneFormProps> = ({ onSubmit, onClose }) => {
  const validationSchema = Yup.object({
    zoneName: Yup.string().required('Zone name is required'),
  })

  return (
    <View style={tw`p-4`}>
      <Text style={tw`text-lg font-semibold mb-4`}>Add Zone</Text>
      <Formik
        initialValues={{ zoneName: '' }}
        validationSchema={validationSchema}
        onSubmit={(values) => {
          onSubmit(values)
          onClose()
        }}
      >
        {({ handleChange, handleSubmit, values, errors, touched }) => (
          <View>
            <MyTextInput
              label="Zone Name"
              value={values.zoneName}
              onChangeText={handleChange('zoneName')}
              error={!!(touched.zoneName && errors.zoneName)}
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

export default AddressZoneForm