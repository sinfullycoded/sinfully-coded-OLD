import imagemin from 'imagemin';
import imageminWebp from 'imagemin-webp';

(async () => {
	await imagemin(['src/images/*.{jpg,png}'], {
		destination: 'public/assets/images',
		plugins: [
			imageminWebp({quality: 100})
		]
	});

	console.log('Images optimized');
})();