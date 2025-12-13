import React, { useState, useEffect } from 'react'
import { View, Text } from 'react-native'
import { MyButton, StorageServiceCasual, tw } from 'common-ui'

interface Props {
  children: React.ReactNode
}

const FirstUserWrapper: React.FC<Props> = ({ children }) => {
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null)

  useEffect(() => {
    const checkFirstTime = async () => {
      const value = await StorageServiceCasual.getItem('isFirstTimeUser')
      setIsFirstTime(value !== 'false')
    }
    checkFirstTime()
  }, [])

  const handleNext = async () => {
    await StorageServiceCasual.setItem('isFirstTimeUser', 'false')
    setIsFirstTime(false)
  }

  if (isFirstTime === null) {
    return null
  }

  if (isFirstTime) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-gray-50`}>
        <Text style={tw`text-2xl mb-5`}>Hello Happy Shopping</Text>
        <View style={tw`flex justify-center`}>
        <MyButton textContent='Next' onPress={handleNext} />
        </View>
      </View>
    )
  }

  return <>{children}</>
}

export default FirstUserWrapper