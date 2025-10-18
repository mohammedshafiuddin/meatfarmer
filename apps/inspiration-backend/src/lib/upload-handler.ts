import multerParent from 'multer';
const uploadHandler = multerParent({
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
    }
});

export default uploadHandler