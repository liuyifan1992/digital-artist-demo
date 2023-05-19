import { useRef, useState, useEffect, useMemo } from 'react';
import { Text, Page } from '@vercel/examples-ui'
import Layout from '@/components/layout';
import styles from '@/styles/Home.module.css';
import { Message } from '@/types/chat';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import LoadingDots from '@/components/ui/LoadingDots';
import { Document } from 'langchain/document';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/Button';
import Balancer from 'react-wrap-balancer'
import clsx from 'clsx';

// wrap Balancer to remove type errors :( - @TODO - fix this ugly hack
const BalancerWrapper = (props: any) => <Balancer {...props} />

export default function Home() {


  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [sourceDocs, setSourceDocs] = useState<Document[]>([]);
  const [messageState, setMessageState] = useState<{
    messages: Message[];
    pending?: string;
    history: [string, string][];
    pendingSourceDocs?: Document[];
  }>({
    messages: [
      {
        message: 'Hi, I am CC how can i help you?',
        type: 'apiMessage',
      },
    ],
    history: [],
    pendingSourceDocs: [],
  });

  const { messages, pending, history, pendingSourceDocs } = messageState;

  console.log('messageState', messageState);

  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  //handle form submission
  async function handleSubmit(e: any) {
    e.preventDefault();

    if (!query) {
      alert('Please input a question');
      return;
    }

    const question = query.trim();

    setMessageState((state) => ({
      ...state,
      messages: [
        ...state.messages,
        {
          type: 'userMessage',
          message: question,
        },
      ],
      pending: undefined,
    }));

    setLoading(true);
    setQuery('');
    setMessageState((state) => ({ ...state, pending: '' }));

    const ctrl = new AbortController();

    try {
      fetchEventSource('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          history,
        }),
        signal: ctrl.signal,
        onmessage: (event) => {
          console.log(event);
          if (event.data === '[DONE]') {
            setMessageState((state) => ({
              history: [...state.history, [question, state.pending ?? '']],
              messages: [
                ...state.messages,
                {
                  type: 'apiMessage',
                  message: state.pending ?? '',
                  sourceDocs: state.pendingSourceDocs,
                },
              ],
              pending: undefined,
              pendingSourceDocs: undefined,
            }));
            setLoading(false);
            ctrl.abort();
          } else {
            const data = JSON.parse(event.data);
            if (data.sourceDocs) {
              setMessageState((state) => ({
                ...state,
                pendingSourceDocs: data.sourceDocs,
              }));
            } else {
              setMessageState((state) => ({
                ...state,
                pending: (state.pending ?? '') + data.data,
              }));
            }
          }
        },
      });
    } catch (error) {
      setLoading(false);
      console.log('error', error);
    }
  }

  //prevent empty submissions
  const handleEnter = (e: any) => {
    if (e.key === 'Enter' && query) {
      handleSubmit(e);
    } else if (e.key == 'Enter') {
      e.preventDefault();
    }
  };

  const chatMessages = useMemo(() => {
    return [
      ...messages,
      ...(pending
        ? [
            {
              type: 'apiMessage',
              message: pending,
              sourceDocs: pendingSourceDocs,
            },
          ]
        : []),
    ];
  }, [messages, pending, pendingSourceDocs]);
  const convertNewLines = (text: string) =>
  text.split('\n').map((line, i) => (
    <span key={i}>
      {line}
      <br />
    </span>
  ))
  return (
    <>
    <section className="flex flex-row gap-6 justify-center">
      <Text variant="h1"
        className='text-zinc-800'
        style={{fontSize:'2rem', fontWeight:'600'}}
      >
        CC - Digital Artist
      </Text>
    </section>
    <Page className="rounded-2xl border-zinc-1000  lg:border lg:p-6">
        {chatMessages.map((message, index) => (
          <div
            className={
              message.type === 'apiMessage'
                ? 'float-left clear-both '
                : 'float-right clear-both '
            }
            key= {message.message+index}
          >

              <div
                className={
                  message.type === 'apiMessage'
                    ? 'float-right mb-5 rounded-lg bg-emerald-200 px-4 py-5 shadow-lg ring-1 ring-zinc-100 sm:px-6'
                    : 'float-right mb-5 rounded-lg  px-4 py-5 shadow-lg ring-1 ring-zinc-100 sm:px-6'
                }
              >
              <BalancerWrapper>
                <div className="flex space-x-3">
                  <div className="flex-1 gap-4">
                    <p className="font-large text-xxl text-gray-900">
                      <a href="#" className="hover:underline">
                        {message.type === 'apiMessage' ? 'AI' : 'You'}
                      </a>
                    </p>
                    <p
                      className={clsx(
                        'text ',
                        message.type === 'apiMessage' ? 'font-semibold font- ' : 'text-gray-400'
                      )}
                    >
                      {convertNewLines(message.message)}
                    </p>
                  </div>
                </div>
                </BalancerWrapper>
              </div>

          </div>
        ))}
    </Page>
    <form onSubmit={handleSubmit} className='flex w-full max-w-3xl mx-auto rounded-2xl  lg:p-62'>
          <textarea
            disabled={loading}
            onKeyDown={handleEnter}
            ref={textAreaRef}
            autoFocus={false}
            rows={1}
            maxLength={512}
            aria-label="chat input"
            required
            className="min-w-0 flex-auto appearance-none rounded-md border border-zinc-900/10 bg-white px-3 py-[calc(theme(spacing.2)-1px)] shadow-md shadow-zinc-800/5 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 sm:text-sm"
            style={{width:"680px"}}
            id="userInput"
            name="userInput"
            placeholder={
              loading
                ? 'Waiting for response...'
                : 'Send a query...'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 justify-center rounded-md py-2 px-3 text-sm outline-offset-2 transition active:transition-none bg-zinc-600 font-semibold text-zinc-100 hover:bg-zinc-400 active:bg-zinc-800 active:text-zinc-100/70 ml-4 flex-none"
          >
            Submit
          </Button>
        </form>
    </>
  );
}
