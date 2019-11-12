const winston                           = require('winston');
const { format }                        = winston;
const { combine, timestamp, colorize }  = format;

const enumerateErrorFormat = format(info => {
    if (info.message instanceof Error) {
        info.message = Object.assign({
            message: info.message.message,
            stack: info.message.stack
        }, info.message);
    }

    if (info instanceof Error) {
        return Object.assign({
            message: info.message,
            stack: info.stack
        }, info);
    }

    return info;
});

const printFormat = winston.format.printf(info => {
    if (info[Symbol.for("level")] === "error" && !info.stack && !info.message) {
        info.message = JSON.stringify(info);
    }
    
    let splat = info[Symbol.for("splat")];
    return `[${info.timestamp}] ${info.level} ${info.stack||info.message} ${splat ? JSON.stringify(splat) : ''}`;
});

function getFormat() {
    return combine(
        colorize(),
        timestamp({format: 'YYYY-MM-DD HH:mm:ss:sss'}),
        printFormat
    );
}

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: getFormat(),
    transports: [
        new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
        new winston.transports.Console({ format: getFormat() })
    ]
});

module.exports = logger;