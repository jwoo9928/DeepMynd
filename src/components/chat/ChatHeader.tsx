import { Menu, MoreVertical } from "lucide-react";
import React, { useEffect } from "react";
// import { EVENT_TYPES, eventEmitter } from "../../controllers/events";

const ChatHeader = ({ toggleSidebar }: {
    toggleSidebar: () => void;
}) => {
    // const [roomName, setRoomName] = React.useState<string | null>(null);
    // const [roomImage, setRoomImage] = React.useState<string | null>(null);

    useEffect(() => {
        // const handleChangeRoom = (roomId: string) => {
        //     const { image, name } = ChatControlle.getInstance().getChatRoom(roomId);
        //     setRoomName(name);
        //     setRoomImage(image);

        // }
        // eventEmitter.on(EVENT_TYPES.ROOM_CHANGED, handleChangeRoom);
        // return () => {
        //     eventEmitter.off(EVENT_TYPES.ROOM_CHANGED, handleChangeRoom);
        // }
    }, []);




    return(
        <div className="h-16 bg-white border-b border-gray-200 flex items-center px-4 justify-between">
        <div className="flex items-center space-x-4">
            <button className="md:hidden" onClick={toggleSidebar}>
                <Menu className="h-6 w-6 text-gray-600" />
            </button>
            <div className="flex items-center space-x-3">
                {/* <div className="w-10 h-10 bg-gray-300 rounded-full">
                    {roomImage?<img src={roomImage} alt="DeepMynd" className="w-10 h-10 rounded-full" />:null}
                </div>
                <h2 className="font-medium">{roomName}</h2> */}
            </div>
        </div>
        <button>
            <MoreVertical className="h-6 w-6 text-gray-600" />
        </button>
    </div>
    )
}

export default React.memo(ChatHeader);