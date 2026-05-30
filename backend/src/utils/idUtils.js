const generateMongoObjectId = () => {
  const timestamp = Math.floor(new Date().getTime() / 1000).toString(16).padStart(8, '0');
  const machine = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  const process = Math.floor(Math.random() * 65535).toString(16).padStart(4, '0');
  const counter = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  return timestamp + machine + process + counter;
};

const generateOneBloodId = async (UserModel) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion
  const MAX_ATTEMPTS = 10;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let id = 'OB-';
    for (let i = 0; i < 6; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    const existing = await UserModel.findOne({ where: { onebloodId: id } });
    if (!existing) return id;
  }
  throw new Error('Could not generate unique OneBlood ID');
};

module.exports = {
  generateMongoObjectId,
  generateOneBloodId
};
