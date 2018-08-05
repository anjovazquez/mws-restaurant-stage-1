if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        if ('serviceWorker' in navigator) {
            if (!navigator.serviceWorker) return;
            navigator.serviceWorker.register('sw.js').then(function (registration) {
                console.log('Registration ok!' + registration.scope);
            }).catch(function () {
                console.log('Registration ko!');
            });
        }
    });
}