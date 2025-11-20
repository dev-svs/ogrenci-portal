exports.getRecommendations = (req, res) => {
    const { interests } = req.body;

    if (!interests || !Array.isArray(interests)) {
        return res.status(400).json({ message: "interests array required" });
    }

    const clubs = [
        { id: 1, name: "Müzik Kulübü", tags: ["müzik"] },
        { id: 2, name: "Siber Güvenlik Kulübü", tags: ["siber", "hacking"] },
        { id: 3, name: "Tiyatro Kulübü", tags: ["sanat"] },
        { id: 4, name: "AI Kulübü", tags: ["yapay zeka", "yazılım"] }
    ];

    const recommended = clubs.filter(club =>
        club.tags.some(tag => interests.includes(tag))
    );

    res.json(recommended);
};
