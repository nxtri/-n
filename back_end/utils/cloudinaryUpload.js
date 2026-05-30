const cloudinary = require('../config/cloudinary');

const uploadFileToCloudinary = (file, folder = 'phongtro') => {
    return new Promise((resolve, reject) => {
        if (!file?.buffer) {
            return reject(new Error('Không tìm thấy dữ liệu file để upload lên Cloudinary.'));
        }

        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: file.mimetype?.startsWith('video/') ? 'video' : 'image',
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );

        stream.end(file.buffer);
    });
};

const uploadFilesToCloudinary = async (files = [], folder = 'phongtro') => {
    return Promise.all(files.map(file => uploadFileToCloudinary(file, folder)));
};

module.exports = {
    uploadFileToCloudinary,
    uploadBufferToCloudinary: uploadFileToCloudinary,
    uploadFilesToCloudinary,
};
