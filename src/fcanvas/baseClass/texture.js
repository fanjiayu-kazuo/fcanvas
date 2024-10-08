export class Texture {
    constructor(imageSource, options = {}) {
        this.image = new Image();
        this.imageSource = imageSource;
        this.options = {
            repeat: 'no-repeat',
            scale: 'cover',
            ...options
        };
        
        this.isLoaded = false;
        this.loadPromise = this.loadImage();
    }

    normalizeImageSource(source, basePath) {
        // 如果是完整的URL或者数据URI，直接返回
        if (source.startsWith('http') || source.startsWith('data:')) {
            return source;
        }
        // 如果是相对路径，转换为绝对路径
        try {
            const absoluteUrl = new URL(source, basePath).href;
            console.log(`Normalized URL: ${absoluteUrl}`);
            return absoluteUrl;
        } catch (error) {
            console.error('Failed to normalize image source:', error);
            // 提供详细的错误信息
            console.error(`Source: ${source}, Base URL: ${basePath}`);
            return source; // Fallback to the original source
        }
    }

    async loadImage() {
        return new Promise((resolve, reject) => {
            this.image.onload = () => {
                this.isLoaded = true;
                console.log('Image loaded successfully.');
                resolve(this.image);
            };
            this.image.onerror = (error) => {
                console.error('Failed to load texture image.', error);
                reject(error);
            };
            this.image.src = this.imageSource;
        });
    }

    async applyTo(context, shape, callback) {
        if (!this.isLoaded) {
            await this.loadPromise;
        }

        context.save();
        const {x, y, width, height} = shape.getBoundingBox();
        shape.clip(context);

        // 应用纹理选项
        context.imageSmoothingEnabled = this.options.smooth !== false;
        
        if (this.options.repeat === 'repeat') {
            const pattern = context.createPattern(this.image, 'repeat');
            context.fillStyle = pattern;
            context.fillRect(x, y, width, height);
        } else {
            this.drawScaledImage(context, x, y, width, height);
        }

        if (callback && typeof callback === 'function') {
            callback(context, shape);
        }

        context.restore();
    }

    drawScaledImage(context, x, y, width, height) {
        const { scale } = this.options;
        let sx, sy, sWidth, sHeight;

        if (scale === 'cover') {
            const ratio = Math.max(width / this.image.width, height / this.image.height);
            sWidth = this.image.width;
            sHeight = this.image.height;
            sx = (sWidth * ratio - width) / 2 / ratio;
            sy = (sHeight * ratio - height) / 2 / ratio;
        } else if (scale === 'contain') {
            const ratio = Math.min(width / this.image.width, height / this.image.height);
            sWidth = width / ratio;
            sHeight = height / ratio;
            sx = (this.image.width - sWidth) / 2;
            sy = (this.image.height - sHeight) / 2;
        } else {
            sx = sy = 0;
            sWidth = this.image.width;
            sHeight = this.image.height;
        }
        context.drawImage(this.image, sx, sy, sWidth, sHeight, x, y, width, height);
    }

    // 静态方法用于预加载多个纹理
    static preload(textures) {
        return Promise.all(textures.map(texture => texture.loadPromise));
    }
}