const fetch = require('node-fetch')
const moment = require('moment')
const _ = require('lodash')
require('colors')

// Auth Configuration
let API_TOKEN = '',
USERNAME = '',
PASSWORD = ''

const getAccountToken = () => new Promise((resolve, reject) => {
  try {
    fetch(`https://www.quiz.id/api/login?email=${USERNAME}&password=${PASSWORD}`, {
      method: 'POST'
    })
    .then(res => res.json())
    .then(result => {
      resolve(result.api_token)
    })
  } catch(err) {
    reject(err)
  }
})

const getAccountInfo = () => new Promise((resolve, reject) => {
  try {
    fetch(`https://www.quiz.id/api/account?api_token=${API_TOKEN}`)
    .then(res => res.json())
    .then(result => {
      resolve(result.data)
    })
  } catch(err) {
    reject(err)
  }
})

const getSemuaBerita = () => new Promise((resolve, reject) => {
  try {
    fetch(`https://www.quiz.id/api/quiz/quz_begin/desc/0/10000?api_token=${API_TOKEN}`)
    .then(res => res.json())
    .then(result => {
      var quiz_id = []
      result.data.map(item => {
        if (item.his_score == null) {
          quiz_id.push(item.quz_id)
        }
      })
      resolve(quiz_id)
    })
  } catch(err) {
    reject(err)
  }
})

const getJawabanBerita = (BERITA_ID) => new Promise((resolve, reject) => {
  try {
    fetch(`https://www.quiz.id/api/playv2/${BERITA_ID}?api_token=${API_TOKEN}`)
    .then(res => res.json())
    .then(result => {
      var quiz_id = []
      var quiz_jawaban = []
      result.question.map(item => {
        quiz_id.push(item.qus_id)
        item.answer.map(ans => {
          quiz_jawaban.push({
            id: item.qus_id,
            jawaban: ans.ans_id
          })
        })
      })
      
      const customArray = []
      const groupElement = _.groupBy(quiz_jawaban, item => item.id)
      quiz_id.map(item => {
        customArray.push({
          id: item,
          jawaban: groupElement[item][Math.floor(Math.random()*3)].jawaban
        })
      })

      const groupToObject = {}
      for (var i=0; i<customArray.length; i++) {
        groupToObject[customArray[i].id] = customArray[i].jawaban
      }
      
      resolve({
        "api_token": `${API_TOKEN}`,
        "question": groupToObject,
        "timer":165
      })
    })
  } catch(err) {
    reject(err)
  }
})

const postJawabanBerita = (BERITA_ID, BODY_POST) => new Promise((resolve, reject) => {
  try {
    fetch(`https://www.quiz.id/api/history/${BERITA_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Host': 'www.quiz.id',
        'Accept-Encoding': 'gzip',
        'User-Agent': 'okhttp/3.12.1'
      },
      body: JSON.stringify(BODY_POST)
    })
    .then(res => res.text())
    .then(result => {
      resolve(result)
    })
  } catch(err) {
    reject(err)
  }
})

const runningBot = () => new Promise(async () => {
  try {
    const resGBH = await getSemuaBerita()

    if (resGBH.length<1) {
      const resGAI = await getAccountInfo()
      console.log(`[${moment().format('HH:MM:SS')}] Users Point : ${`${resGAI.usr_point}`.bold.green} | Quiz Solving : ${`${resGAI.quiz}`.bold.green}`)
      console.log(`Oopps!! I can\'t fetch news data, you already input all quiz`.bold.red)
    } else {
      resGBH.map(async (item) => {
        const resGJB = await getJawabanBerita(item)
        const resPJB = await postJawabanBerita(item, resGJB)
        const resGAI = await getAccountInfo()
        console.log(`[${moment().format('HH:MM:SS')}] ${`${resPJB.score}`.bold.green} | Users Point : ${`${resGAI.usr_point}`.bold.green} | Quiz Solving : ${`${resGAI.quiz}`.bold.green}`)
      })
    }
  } catch(err) {
    reject(err)
  }
})

;(async () => {
  try {
    if (API_TOKEN) {
      await runningBot()
    } else if (USERNAME && PASSWORD) {
      API_TOKEN = await getAccountToken()
      await runningBot()
    } else {
      console.log(`Authentication failed, please setup your auth configuration`.bold.red)
    }
  } catch(err) {
    console.log(err)
  }
})()