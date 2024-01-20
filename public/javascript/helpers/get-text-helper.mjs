const BASE_URL = 'http://localhost:3333/game/texts/'

export const getTextForGame = async (id) => {
 const url = BASE_URL + id

 const response = await fetch(url)
 const data = await response.json()

 return data
}