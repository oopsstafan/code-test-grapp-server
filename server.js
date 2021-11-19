import app from './app.js'

app.listen(8000, err => {
    if (!err) {
        console.log('server is running on port 8000')
    }
})