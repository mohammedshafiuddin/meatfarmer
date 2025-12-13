import React, { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { BottomDialog } from 'common-ui'
import { tw } from 'common-ui'
import { trpc } from '@/src/trpc-client'
import AddressZoneForm from '@/components/AddressZoneForm'
import AddressPlaceForm from '@/components/AddressPlaceForm'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'

const AddressManagement: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'zone' | 'place' | null>(null)
  const [expandedZones, setExpandedZones] = useState<Set<number>>(new Set())

  const { data: zones, refetch: refetchZones } = trpc.admin.address.getZones.useQuery()
  const { data: areas, refetch: refetchAreas } = trpc.admin.address.getAreas.useQuery()

  const createZone = trpc.admin.address.createZone.useMutation({
    onSuccess: () => {
      refetchZones()
      setDialogOpen(false)
    },
  })

  const createArea = trpc.admin.address.createArea.useMutation({
    onSuccess: () => {
      refetchAreas()
      setDialogOpen(false)
    },
  })

  const handleAddZone = () => {
    setDialogType('zone')
    setDialogOpen(true)
  }

  const handleAddPlace = () => {
    setDialogType('place')
    setDialogOpen(true)
  }

  const toggleZone = (zoneId: number) => {
    setExpandedZones(prev => {
      const newSet = new Set(prev)
      if (newSet.has(zoneId)) {
        newSet.delete(zoneId)
      } else {
        newSet.add(zoneId)
      }
      return newSet
    })
  }

  const groupedAreas = areas?.reduce((acc, area) => {
    if (area.zoneId) {
      if (!acc[area.zoneId]) acc[area.zoneId] = []
      acc[area.zoneId].push(area)
    }
    return acc
  }, {} as Record<number, typeof areas[0][]>) || {}

  const unzonedAreas = areas?.filter(a => !a.zoneId) || []

  return (
    <View style={tw`flex-1 bg-white`}>
      <View style={tw`flex-row justify-between p-4`}>
        <TouchableOpacity style={tw`bg-blue1 px-4 py-2 rounded`} onPress={handleAddZone}>
          <Text style={tw`text-white`}>Add Zone</Text>
        </TouchableOpacity>
        <TouchableOpacity style={tw`bg-green1 px-4 py-2 rounded`} onPress={handleAddPlace}>
          <Text style={tw`text-white`}>Add Place</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={tw`flex-1 p-4`}>
        {zones?.map(zone => (
          <View key={zone.id} style={tw`mb-4 border border-gray-300 rounded`}>
            <TouchableOpacity style={tw`flex-row items-center p-3 bg-gray-100`} onPress={() => toggleZone(zone.id)}>
              <Text style={tw`flex-1 text-lg font-semibold`}>{zone.zoneName}</Text>
              <MaterialIcons name={expandedZones.has(zone.id) ? 'expand-less' : 'expand-more'} size={24} />
            </TouchableOpacity>
            {expandedZones.has(zone.id) && (
              <View style={tw`p-3`}>
                {groupedAreas[zone.id]?.map(area => (
                  <Text key={area.id} style={tw`text-base mb-1`}>- {area.placeName}</Text>
                )) || <Text style={tw`text-gray-500`}>No places in this zone</Text>}
              </View>
            )}
          </View>
        ))}

        <View style={tw`mt-6`}>
          <Text style={tw`text-xl font-bold mb-2`}>Unzoned Places</Text>
          {unzonedAreas.map(area => (
            <Text key={area.id} style={tw`text-base mb-1`}>- {area.placeName}</Text>
          ))}
          {unzonedAreas.length === 0 && <Text style={tw`text-gray-500`}>No unzoned places</Text>}
        </View>
      </ScrollView>

      <BottomDialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        {dialogType === 'zone' && <AddressZoneForm onSubmit={createZone.mutate} onClose={() => setDialogOpen(false)} />}
        {dialogType === 'place' && <AddressPlaceForm onSubmit={createArea.mutate} onClose={() => setDialogOpen(false)} />}
      </BottomDialog>
    </View>
  )
}

export default AddressManagement