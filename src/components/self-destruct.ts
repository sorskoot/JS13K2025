export default AFRAME.registerComponent('self-destruct', {
    schema: {
        timer: {default: 5000},
    },
    tick: function (time, timeDelta) {
        this.data.timer -= timeDelta;
        if (this.data.timer < 0) {
            this.el.remove();
        }
    },
});
