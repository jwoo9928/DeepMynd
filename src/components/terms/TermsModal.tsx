import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import termsContent from './terms.md?raw';

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAgree: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, onAgree }) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <div className="fixed inset-0 bg-black bg-opacity-25" />
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <div className="w-[80vw] h-[80vh] transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all flex flex-col">
                            <h3 className="text-xl font-medium leading-6 text-gray-900 mb-4">
                                Terms and Conditions
                            </h3>
                            <div className="flex-1 overflow-y-auto prose max-w-none">
                                <ReactMarkdown>{termsContent}</ReactMarkdown>
                            </div>
                            <div className="mt-4 flex justify-end space-x-3 pt-4 border-t">
                                <button
                                    type="button"
                                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                                    onClick={onClose}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                    onClick={() => {
                                        onAgree();
                                        onClose();
                                    }}
                                >
                                    I Agree
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default TermsModal; 