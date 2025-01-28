import axios from "axios";
import { apiBaseURL } from "../constant";
import { Response } from "../interface";

const getGPTResponse = async (prompt: string) => {
    const response = await axios.post(`${apiBaseURL}/gpt_handler/`, {
        message: prompt
    }, {
        headers: {
            'Content-Type': 'application/json'
        }
    })
    return response.data as Response;
}

const getGeminiResponse = async (prompt: string) => {
    const response = await axios.post(`${apiBaseURL}/gemini_handler/`, {
        message: prompt
    }, {
        headers: {
            'Content-Type': 'application/json'
        }
    })
    return response.data as Response;
}

const getClaudeResponse = async (prompt: string) => {
    const response = await axios.post(`${apiBaseURL}/claude_handler/`, {
        message: prompt
    }, {
        headers: {
            'Content-Type': 'application/json'
        }
    })
    return response.data as Response;
}

const getMistralResponse = async (prompt: string) => {
    const response = await axios.post(`${apiBaseURL}/mistral_handler/`, {
        message: prompt
    }, {
        headers: {
            'Content-Type': 'application/json'
        }
    })
    return response.data as Response;
}

const getHistory = async () => {
    const response = await axios.get(`${apiBaseURL}/gpt_handler/history/`)
    return response.data;
}

export default {
    getGPTResponse,
    getGeminiResponse,
    getClaudeResponse,
    getMistralResponse,
    getHistory
}

