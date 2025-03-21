import { useAtomValue, useSetAtom } from "jotai";
import { LogIn, MoreVertical, User } from "lucide-react";
import { authModalOpen } from "../../stores/ui.store";
import { useCallback } from "react";
import { userInfoAtom } from "../../stores/data.store";
import { AuthController } from "../../controllers/AuthController";

// Render user info section
const UserInfoSection = () => {
  const setAuthModalIsOpen = useSetAtom(authModalOpen);
  const userInfo = useAtomValue(userInfoAtom);

  const extractEmailPrefix = useCallback((email: string) => {
    // 이메일을 '@' 기준으로 분리
    const [localPart] = email.split('@');

    // '.'이 있다면 '@' 앞의 '.' 이전 부분만 반환, 없으면 그대로 반환
    const prefix = localPart.includes('.') ? localPart.split('.')[0] : localPart;

    return prefix;
  }, [])

  return (
    <div className="border-t border-gray-200 p-4">
      {userInfo ? (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
            <img
              src={userInfo.user_metadata?.avatar_url ?? "public/assets/deepmynd.jpg"}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-sm">{extractEmailPrefix(userInfo.email ?? "") || "User"}</h3>
            <p className="text-xs text-gray-500">{userInfo.email || "user@example.com"}</p>
          </div>
          <button className="p-2 text-gray-600 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
            onClick={() => { AuthController.getInstance().signOut() }}>
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Not logged in</p>
              <p className="text-xs text-gray-500">Sign in to sync your chats</p>
            </div>
          </div>
          <button
            className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
            onClick={() => setAuthModalIsOpen(true)}
          >
            <LogIn className="h-3.5 w-3.5" />
            Log In
          </button>
        </div>
      )}
    </div>
  )
};

export default UserInfoSection;