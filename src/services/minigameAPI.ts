import axios from "axios";

const API_URL = "http://localhost:8080/api/minigames";

export const minigameAPI = {
    createMiniGame: async (data: any) => {
        const res = await axios.post(API_URL, data, {
            headers: { "Content-Type": "application/json" },
        });
        return res.data;
    },

    addQuiz: async (id: number, quizData: any) => {
        const res = await axios.post(`${API_URL}/${id}/quiz`, quizData, {
            headers: { "Content-Type": "application/json" },
        });
        return res.data;
    },


    getByActivity: async (activityId: number) => {
        const res = await axios.get(`http://localhost:8080/api/minigames/by-activity/${activityId}`);
        console.log(" minigameAPI.getByActivity response:", res.data);
        return res.data;
    },


    updateByActivity: async (activityId: number, data: any) => {
        const token = localStorage.getItem("token");

        console.log("🔑 Sending token:", token);

        const res = await axios.put(
            `${API_URL}/by-activity/${activityId}`,
            data,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return res.data;
    },


};
