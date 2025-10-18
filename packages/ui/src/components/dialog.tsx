import React, { ReactNode, useState } from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, Animated, Easing, Dimensions, TextInput } from 'react-native';
import MyText from './text';
import { MyButton } from 'common-ui';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const BottomDialog: React.FC<DialogProps> = ({ open, onClose, children }) => {
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));

  React.useEffect(() => {
    if (open) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [open]);

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View
        style={[
          styles.dialog,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.handle} />
        {children}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  dialog: {
    position: 'absolute',
    left: 0,
    right: 0,
    // top: SCREEN_HEIGHT * 0.3,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 20,
    // paddingTop: 16,
    paddingBottom: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    // marginBottom: 12,
  },
});

const commentStyles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    fontSize: 16,
  },
});

export default BottomDialog;

interface ConfirmationDialogProps {
  open: boolean;
  positiveAction: (comment?: string) => void;
  commentNeeded?: boolean;
  negativeAction?: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = (props) => {
  const { 
    open, 
    positiveAction, 
    commentNeeded = false,
    negativeAction,
    title = "Are you sure?",
    message = "Do you really want to proceed with this action?",
    confirmText = "Confirm",
    cancelText = "Cancel"
  } = props;
  
  const [comment, setComment] = useState('');

  const handleConfirm = () => {
    positiveAction(commentNeeded ? comment : undefined);
    setComment(''); // Reset comment after action
  };

  const handleCancel = () => {
    if (negativeAction) {
      negativeAction();
    }
    setComment(''); // Reset comment on cancel
  };

  return (
    <BottomDialog open={open} onClose={handleCancel}>
      <View style={{ padding: 20 }}>
        <MyText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
          {title}
        </MyText>
        <MyText style={{ marginBottom: commentNeeded ? 16 : 24 }}>
          {message}
        </MyText>
        
        {commentNeeded && (
          <View style={commentStyles.container}>
            <TextInput
              style={commentStyles.input}
              value={comment}
              onChangeText={setComment}
              placeholder="Add a comment..."
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        )}
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: commentNeeded ? 16 : 0 }}>
          <MyButton textContent={cancelText} onPress={handleCancel} fillColor="gray1" textColor="white1" />
          <MyButton textContent={confirmText} style={{ flexShrink: 0 }} onPress={handleConfirm} fillColor="red1" textColor="white1" />
        </View>
      </View>
    </BottomDialog>
  );
}